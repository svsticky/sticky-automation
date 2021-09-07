#!/usr/bin/python
import shutil, fnmatch, os, re
from shutil import copyfile

# Load environment variables
from dotenv import load_dotenv
load_dotenv()

# Copy all javascript files to /Composed
def filterJavascriptFiles():
	matches = []
	for root, dirnames, filenames in os.walk('Projects'):
	    for filename in fnmatch.filter(filenames, '*.js'):
	        copyfile(os.path.join(root, filename), "Composed/Compiled_" + filename)
	        matches.append("Composed/Compiled_" + filename)
	return matches

# Read files and return lines
def readFile(path): 
	return open(path).read().splitlines()

def checkLib(lines):
	libmatches = []
	for line in lines:
		if "INSERTLIB" in line:
			libmatches.append(line[12:])
	return libmatches

def checkEnvVars(file, path):
	contents = open(path).read()
	for envVar in re.finditer("(ENV_)\w+", contents):
		varText = envVar.group()
		contents = contents.replace(varText, os.environ.get(varText[4:]))

	file.truncate(0)
	file.write(contents)
	return file

# Main
for filepath in filterJavascriptFiles():
	# list of libraries required in file
	libfile = open(filepath, "a")
	libPaths = checkLib(readFile(filepath))
	for libPath in libPaths:
		libfile.write("\n")
		# list of lines from a library
		for libLine in readFile(libPath):
			libfile.write(libLine + "\n")
	libfile.close()

	# Place env variables in files
	envfile = open(filepath, "a")
	checkEnvVars(envfile, filepath)
