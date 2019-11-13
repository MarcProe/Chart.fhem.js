#!/bin/bash

#inspired from https://github.com/RFD-FHEM/UnitTest/blob/master/build_controls_list.sh

echo "DIR www/chart.js" > controls_chart.txt
while IFS= read -r -d '' FILE
do
    TIME=$(git log --pretty=format:%cd -n 1 --date=iso -- "$FILE")
    TIME=$(TZ=Europe/Berlin date -d "$TIME" +%Y-%m-%d_%H:%M:%S)
    FILESIZE=$(stat -c%s "$FILE")
        FILE=$(echo "$FILE"  | cut -c 3-)
        printf "UPD %s %-7d %s\n" "$TIME" "$FILESIZE" "$FILE"  >> controls_chart.txt
done <   <(find . -maxdepth 3 \( -name "*.css" -o -name "*.js" -o -name "*.json" \) -a -type f  -print0 | sort -z -g)
git log --pretty=format:"%h - %an, %ad : %s" > CHANGED
cat controls_chart.txt
