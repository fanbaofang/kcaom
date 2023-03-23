#!/bin/sh
basepath=$(cd `dirname $0`; pwd -P)
AgentFunc=${basepath}"/AgentFunc.sh"
ServerFunc=${basepath}"/ServerFunc.sh"
.  $AgentFunc
.  $ServerFunc

value=""
level="Normal" # "Normal" "Offline" "Unknown" "Hint" "Warning" "Secondary" "major" "Error"
notes=""
# shell script

echo "Shell"
value=`cat /proc/cpuinfo | grep name | cut -f2 -d: | uniq -c`

# return
echo "value[$value]"
echo "level[$level]"
echo "notes[$notes]"
