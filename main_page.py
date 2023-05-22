import csv
import random
import json
import time
from types import SimpleNamespace

from flask import Flask
from flask import render_template
from flask import request
from flask import abort, redirect, url_for
app = Flask(__name__)

##############################
# API and webserver requests #
##############################

@app.route('/favicon.ico')
def favicon():
	return redirect(url_for('static', filename='favicon.ico'))

@app.route('/flashcards')
def flashcards():
		return render_template("card3.html")

@app.route('/start')
def setup_page():
		return render_template("start.html")

@app.route('/dev')
def development_page():
	return render_template("question_dev.html");

@app.route('/dev2')
def development_page2():
	return render_template("question_dev2.html");

'''
give id get verbInfo				GET /verb?id={id}				-> verb_info{...}
give verb get verbInfo				GET /verb?verb={verb}			-> verb_info{...}
give id_list get verb_info_list		POST /verb idlist={idlist}		-> verb_info_list[verb_info{...}, ...]
give verb_list get verb_info_list		POST /verb verblist={verblist}	-> verb_info_list[verb_info{...}, ...]
'''
@app.route('/verb', methods=['GET', 'POST'])
def verb_get_api():
	# > 1 arguments will conflict, makes sure there is exactly 1.
	id = request.args.get('id')
	verb = request.args.get('verb')
	id_list = request.form.get('idlist')
	verb_list = request.form.get('verblist')
	if [id, verb, id_list, verb_list].count(None) != 3: abort(400)

	if request.method == 'GET':
		if id != None:
			response = { 'verbInfo':get_word("verb", int(id)).get_info() } # camelCase for the JS side
		if verb != None:
			response = { 'verbInfo':find_word("verb", verb).get_info() }
		return json.dumps(response)
	if request.method == 'POST':
		if id_list != None:
			id_list = id_list.split(" ")
			verb_info_list = []
			for curr in id_list:
				verb_info_list.append(get_word("verb", curr).get_info())
		if verb_list != None:
			verb_list = verb_list.split(" ")
			verb_info_list = []
			for curr in verb_list:
				verb_info_list.append(find_word("verb", curr).get_info())
		return json.dumps(verb_info_list)
'''
give id get wordInfo					GET /word?type={type}&id={id}				-> wordInfo{...}
give word get wordInfo					GET /word?type={type}&word={word}			-> wordInfo{...}
give id_list get word_info_list			POST /word type={type}&idlist=id1+id2+...		-> word_info_list[wordInfo{...}, ...]
give word_list get word_info_list		POST /word type={type}&wordlist=word1+word2...	-> word_info_list[wordInfo{...}, ...]
give mixed_list get word_info_list		POST /word type={type}&list=id1+word2+...		-> word_info_list[wordInfo{...}, ...]				# mixed IDs
give mixed_TYPE_list get word_info_list POST /word mixed=true&list=type1+word1+type2+word2+... -> word_info_list[wordInfo{...}, ...]		# mixed TYPES
'''
@app.route('/word', methods=['GET', 'POST'])
def word_api(): # NEED TO FIND UNIVERSAL ARG GET, request.args is GET args, request.form is POST args. FIX LATER
	type = request.form.get('type')
	mixed = request.form.get('mixed')
	if (type == None or type.lower() not in ["noun", "verb", "adjective", "other"]) and mixed == None: abort(400)
	if mixed == "true" and type != None: abort(400)
	if request.method == 'GET':
		id = request.args.get('id')
		word = request.args.get('word')
		if id == word == None: abort(400)
		if id != None:
			try:
				id = int(id)
			except:
				id = None
			else:
				response = { 'wordInfo':get_word(type, int(id)).get_info() }
		if word != None and id == None:
			response = { 'wordInfo':find_word(type, str(word)).get_info() }
		return json.dumps(response)
	if request.method == 'POST':
		list = request.form.get('list')
		if list == None: abort(400)
		response = []
		if mixed == "true":
			types = list.split(" ")[::2]
			ids = list.split(" ")[1::2]
			if len(types) != len(ids): abort(400)
			for i in range(len(ids)):
				if any(d.isdigit() for d in ids[i]): response.append(get_word(types[i], int(ids[i])).get_info())
				else: response.append(find_word(types[i], ids[i]).get_info())
			return json.dumps(response)
		else:
			for item in list.split(" "):
				if any(i.isdigit() for i in item): response.append(get_word(type, int(item)).get_info())
				else: response.append(find_word(type, item).get_info())
			return json.dumps(response)


#############################
# Word processing functions #
#############################

csvs = SimpleNamespace(nouns=[], verbs=[], adjectives=[], others=[])

def process_csv(csv_name, destination):
	with open(f'./csv/{csv_name}.csv', encoding='utf8', newline='') as csv_file:
		benchmark = time.time()
		csv_reader = csv.reader(csv_file, delimiter='\t')
		count = 0
		for row in csv_reader:
			if count > 0:
				destination.append(row)
			count += 1
		print(f'./csv/{csv_name}.csv processed, {count} lines in {round(time.time() - benchmark, 3)} seconds.')
process_benchmark = time.time()
process_csv("verbs", csvs.verbs)
process_csv("nouns", csvs.nouns)
process_csv("adjectives", csvs.adjectives)
process_csv("others", csvs.others)
print(f"Processed all CSV files, took {round(time.time() - process_benchmark, 3)} seconds.")

# Thought I could frequency compare homonyms to figure the most likely request, forgot that homonyms look exactly the same
# so this wouldn't work anyway. This will only work with non-homonyms, not sure what the use-case is. Leaving it in anyway.
frequency_list = [];
with open('./csv/ru_50k.txt', 'r', encoding='utf8') as frequency_file:
	for line in frequency_file:
		frequency_list.append(line.split(" ")[0])

def frequencyCompare(*args):
	winner = None
	winner_index = 50000;
	for arg in args:
		temp_index = frequency_list.index(arg)
		if temp_index < winner_index:
			winner = arg
	return winner

# What we CAN do for a frequency compare is determine if the passed-in word is declined or conjugated, 
# find the root word, and frequency compare THAT word with any other word that shares the form.


# Get word object from word id
def get_word(type, id):
	id = int(id)
	if type == "verb" and 0 <= id < len(csvs.verbs):
		return Verb(id)
	if type == "noun" and 0 <= id < len(csvs.nouns):
		return Noun(id)
	if type == "adjective" and 0 <= id < len(csvs.adjectives):
		return Adjective(id)
	if type == "other" and 0 <= id < len(csvs.others):
		return Other(id)

def get_random_word(type="random", definition_required=True, max_range=-1):
	if type == "random": type = ["verb", "noun", "adjective", "other"][random.randint(0, 3)]
	if type == "verb":
		if max_range < 0 or max_range > len(csvs.verbs): max_range = len(csvs.verbs) - 1
	if type == "noun":
		if max_range < 0 or max_range > len(csvs.nouns): max_range = len(csvs.nouns) - 1
	if type == "adjective":
		if max_range < 0 or max_range > len(csvs.verbs): max_range = len(csvs.adjectives) - 1
	if type == "other":
		if max_range < 0 or max_range > len(csvs.nouns): max_range = len(csvs.others) - 1
	new_word = get_word(type, random.randint(0, max_range))
	counter = 0
	while new_word.properties.translations_en == "":
		new_word = get_word(type, random.randint(0, max_range))
		counter += 1
		if counter > 50:
			print("! Stuck in loop that shouldn't be sticky !")
			break
	return new_word

# Only checks first word in row, default unaccented masculine/nominative/infinitive form
# Returns list of ID matches from CSV file specified in type
def find_word_id(type, word):
	word = word.replace("\u0301", "") # unaccent
	id = 0
	matches = []
	li = []
	if type == "verb": li = csvs.verbs
	if type == "noun": li = csvs.nouns
	if type == "adjective": li = csvs.adjectives
	if type == "other": li = csvs.others
	for row in li:
		if word == row[0]:
			matches.append(id)
		id += 1
	return matches

# In any case the type is missing, use this to search ALL CSV files
def find_word_id_all_types(word):
	return {
	"verbs":find_word("verb", word),
	"nouns":find_word("noun", word),
	"adjectives":find_word("adjective", word),
	"others":find_word("other", word)
	}

# Get word object from word string
def find_word(type, word):
	ids = find_word_id(type, word)
	if len(ids) == 0: return
	if type == "verb": return Verb(ids[0])
	if type == "noun": return Noun(ids[0])
	if type == "adjective": return Adjective(ids[0])
	if type == "other": return Other(ids[0])

#####################
# Class definitions #
#####################

class Word():
	def __init__(self, type, id, info):
		self.properties = {} 		# ENUM to access the info array
		self.type = type 			# String to identify word type, "noun", "adjective", "verb", or "other"
		self.id = int(id) 			# ID/row position in CSV word was pulled from
		self.info = info 			# Row of CSV containing all info about the word
		self.extra = {"id":self.id, "type":self.type} # Extra metadata to be combined with info when word is requested
		self.clean_info(["*"])		# Clear any unwatned characters from information. Current list of known noise: *

	def accent(self, rows):
		for i in rows:
			self.info[i] = self.info[i].replace("'", "\u0301")
	def to_string(self):
		return f"{self.type}#{self.id} {self.info[0]}"
	def get_info(self):
		result = self.properties.copy()
		i = 0
		for key in result:
			if i >= len(self.info): 
				result = result[:len(self.info)]
				break
			result[key] = self.info[i]
			i += 1
		return {**result, **self.extra}
	def clean_info(self, unwanted_chars):
		for i in range(len(self.info)):
			for char in unwanted_chars:
				self.info[i] = self.info[i].replace(char, "")

class Noun(Word):
	def __init__(self, id):
		Word.__init__(self, "noun", id, csvs.nouns[id])
		self.properties = {
			"bare":0,
			"accented":1,
			"translations_en":2,
			"translations_de":3,
			"gender":4,				# m, f, or n
			"partner":5,			# usually blank, may contain feminine/masculine counterpart EG американец parterner is американка
			"animate":6,			# 0: no, 1: yes, does noun decline to genitive in accusative, sans-female?
			"indeclinable":7,		# 0: no, 1: yes, for foreign borrow words EG радио does not decline !!WARNING!! Words with this may not have declensions listed!
			"sg_only":8,			# 0: no, 1: yes, Words that appear only in singular
			"pl_only":9,			# 0: no, 1: yes, Words that appear only in plural
			"sg_nom":10,
			"sg_gen":11,
			"sg_dat":12,
			"sg_acc":13,
			"sg_inst":14,
			"sg_prep":15,
			"pl_nom":16,
			"pl_gen":17,
			"pl_dat":18,
			"pl_acc":19,
			"pl_inst":20,
			"pl_prep":21,
		}
		self.accent([1, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21])

class Verb(Word):
	def __init__(self, id):
		Word.__init__(self, "verb", id, csvs.verbs[id])
		self.properties = {
			"bare":0,
			"accented":1,
			"translations_en":2,
			"translations_de":3,
			"aspect":4,				# imperfective or perfective
			"partner":5,			# aspectual pair partner, if aspect is imperfective, parter will be perfective
			"imperative_sg":6,
			"imperative_pl":7,
			"past_m":8,
			"past_f":9,
			"past_n":10,
			"past_pl":11,
			"presfut_sg1":12,
			"presfut_sg2":13,
			"presfut_sg3":14,
			"presfut_pl1":15,
			"presfut_pl2":16,
			"presfut_pl3":17
		}
		self.accent([1, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17])

class Adjective(Word):
	def __init__(self, id):
		Word.__init__(self, "adjective", id, csvs.adjectives[id])
		self.properties = {
			"bare":0,
			"accented":1,
			"position":2,			# ?
			"translations_en":3,
			"translations_de":4,
			"incomparable":5,		# ?
			"comparative":6,		# ?
			"superlative":7,		# ?
			"short_m":8,			# Short forms !!WARNING!! Some don't have short forms
			"short_f":9,
			"short_n":10,
			"short_pl":11,
			"decl_m_nom":12,		# Masculine forms
			"decl_m_gen":13,
			"decl_m_dat":14,
			"decl_m_acc":15,
			"decl_m_inst":16,
			"decl_m_prep":17,
			"decl_f_nom":18,		# Feminine forms
			"decl_f_gen":19,
			"decl_f_dat":20,
			"decl_f_acc":21,
			"decl_f_inst":22,
			"decl_f_prep":23,
			"decl_n_nom":24,		# Neuter forms
			"decl_n_gen":25,
			"decl_n_dat":26,
			"decl_n_acc":27,
			"decl_n_inst":28,
			"decl_n_prep":29,
			"decl_pl_nom":30,		# Plural forms
			"decl_pl_gen":31,
			"decl_pl_dat":32,
			"decl_pl_acc":33,
			"decl_pl_inst":34,
			"decl_pl_prep":35
		}
		self.accent([1, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35])

class Other(Word):
	def __init__(self, id):
		Word.__init__(self, "other", id, csvs.others[id])
		self.properties = {
			"bare":0,
			"accented":1,
			"translations_en":2,
			"translations_de":3
		}
		self.accent([1])