from bs4 import BeautifulSoup
from datetime import datetime
import requests
import pymysql
import re
import schedule
import time


con = pymysql.connect(host='localhost', user='root', password='qwer1234',
                       db='DSC', charset='utf8')
cur = con.cursor()
 
codes = ['096530', '010130'] # 종목코드 리스트, (씨젠 고려아연)
prices = [] # 가격정보가 담길 리스트
date= datetime.today()

for code in codes:
    url = 'https://finance.naver.com/item/main.nhn?code=' + code

    response = requests.get(url)
    response.raise_for_status()
    html = response.text
    soup = BeautifulSoup(html, 'html.parser')

    today = soup.select_one('#chart_area > div.rate_info > div')
    price = today.select_one('.blind')
    prices.append(price.get_text())

    temp_price = re.sub(r"[^0-9]", "", prices[0])
    sql = "INSERT INTO stocks VALUES (%s,%s,%s)"
    cur.execute(sql,(code, int(temp_price), date))

    rows = cur.fetchall()
    con.commit()   


con.close()
print(prices)