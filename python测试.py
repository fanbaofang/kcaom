#encoding:gbk
import sys

#year = int(sys.argv[1])
year = 2023
if (year % 4) == 0:
    if (year % 100) == 0:
        if (year % 400) == 0:
            print("{} 是闰年".format(year))  # 整百年能被400整除的是闰年
        else:
            print("{} 不是闰年".format(year))
    else:
        print("{} 是闰年".format(year))  # 非整百年能被4整除的为闰年
else:
    print("{} 不是闰年".format(year))
