#encoding:gbk
import sys

#year = int(sys.argv[1])
year = 2023
if (year % 4) == 0:
    if (year % 100) == 0:
        if (year % 400) == 0:
            print("{} ������".format(year))  # �������ܱ�400������������
        else:
            print("{} ��������".format(year))
    else:
        print("{} ������".format(year))  # ���������ܱ�4������Ϊ����
else:
    print("{} ��������".format(year))
