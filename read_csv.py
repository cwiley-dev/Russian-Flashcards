import csv
import random

with open('verbs.csv', encoding='utf8', newline='') as csv_file:
    csv_reader = csv.reader(csv_file, delimiter='\t')
    line_count = 0
    for row in csv_reader:
        print(row)
        if line_count == 0:
            # Column names
            #print(f'Column names are {", ".join(row)}')
            line_count += 1
        else:
        	# Column values
            #print(f'\t{", ".join(row)}')

            line_count += 1
    print(f'Processed {line_count} lines.')