"""Import the public KBO English monthly schedule (no scores or personal data)."""
import urllib.request, urllib.parse, re, html, json
from html.parser import HTMLParser
from pathlib import Path
URL='https://eng.koreabaseball.com/Schedule/DailySchedule.aspx'
class Inputs(HTMLParser):
 def __init__(self): super().__init__(); self.values={};self.buttons={}
 def handle_starttag(self,tag,attrs):
  a=dict(attrs)
  if tag=='input' and 'name' in a:
   if a.get('type')=='hidden': self.values[a['name']]=a.get('value','')
   if a.get('type')=='image': self.buttons[a.get('alt')]=a['name']
def text(s):return html.unescape(re.sub('<[^>]+>','',s)).strip()
def parse(body):
 games=[];date='';kind=''
 for row in re.findall(r'<tr[^>]*>(.*?)</tr>',body,re.S):
  cells=re.findall(r'<td([^>]*)>(.*?)</td>',row,re.S)
  data={}
  for attrs,value in cells:
   title=re.search(r'title="([^"]+)"',attrs);cl=re.search(r'class="([^"]+)"',attrs)
   key=title[1] if title else cl[1] if cl else ''
   if key=='DATE':date=text(value)[:5].replace('.','-')
   elif key=='TYPE':kind=text(value)
   elif key=='GAME':
    if 'loop_r' in attrs:data['away']=text(value)
    elif 'loop_l' in attrs:data['home']=text(value)
   else:data[key]=text(value)
  if kind=='REGULAR' and data.get('away'):
   games.append({'date':'2026-'+date,'away':data['away'],'home':data['home'],'venue':data['LOCATION'],'time':data['TIME'],'cancelled':data.get('ETC','-') not in ['-','']})
 return games
body=Path('/tmp/kbo.html').read_text();allgames=[]
for i in range(7):
 games=parse(body);allgames+=games;print('month',9-i,'games',len(games),flush=True)
 if i<6:
  inputs=Inputs();inputs.feed(body);data=inputs.values;key=inputs.buttons['이전'];data[key+'.x']='5';data[key+'.y']='5'
  body=urllib.request.urlopen(urllib.request.Request(URL,data=urllib.parse.urlencode(data).encode()),timeout=35).read().decode();Path('/tmp/kbo-month-'+str(8-i)+'.html').write_text(body)
# October published games are included through a fresh September -> next request.
body=Path('/tmp/kbo.html').read_text();inputs=Inputs();inputs.feed(body);data=inputs.values;key=inputs.buttons['다음'];data[key+'.x']='5';data[key+'.y']='5'
body=urllib.request.urlopen(urllib.request.Request(URL,data=urllib.parse.urlencode(data).encode()),timeout=35).read().decode();allgames+=parse(body)
unique={ (g['date'],g['away'],g['home'],g['time']):g for g in allgames }
result={'source':URL,'asOf':'2026-09-16','year':2026,'games':sorted(unique.values(),key=lambda g:(g['date'],g['time'],g['home']))}
Path('src/data/kbo2026.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n');print('total',len(result['games']),flush=True)
