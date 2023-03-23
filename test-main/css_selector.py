# 在 id 为 searchtext 的输入框中输入文本 你好
from selenium import webdriver

wd = webdriver.Chrome(r'D:\webdriver\chromedriver.exe')
wd.get('http://cdn1.python3.vip/files/selenium/sample1.html')

# elements = wd.find_element_by_css_selector('div')
# 等价于
# elements = wd.find_elements_by_tag_name('div')

# <input type="text" id='searchtext' />

# element = wd.find_element_by_css_selector('#searchtext').send_keys('你好')

# 要选择所有 class 属性值为 animal的元素 动物 除了这样写
# elements = wd.find_elements_by_class_name('animal')
# 还可以这样写
# elements = wd.find_elements_by_css_selector('.animal')

# 根据属性选择元素
element = wd.find_element_by_css_selector('[href="http://www.miitbeian.gov.cn"]')

# 打印出元素对应的html
print(element.get_attribute('outerHTML')) #innerHTML