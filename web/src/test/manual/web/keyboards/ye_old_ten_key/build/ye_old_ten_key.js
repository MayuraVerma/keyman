if(typeof keyman === 'undefined') {console.log('Keyboard requires KeymanWeb 10.0 or later');if(typeof tavultesoft !== 'undefined') tavultesoft.keymanweb.util.alert("This keyboard requires KeymanWeb 10.0 or later");} else {KeymanWeb.KR(new Keyboard_ye_old_ten_key());}function Keyboard_ye_old_ten_key(){this._v=(typeof keyman!="undefined"&&typeof keyman.version=="string")?parseInt(keyman.version,10):9;this.KI="Keyboard_ye_old_ten_key";this.KN="ye_old_ten_key";this.KMINVER="10.0";this.KV={F:' 1em "Arial"',K102:0};this.KV.KLS={};this.KV.BK=(function(x){var e=Array.apply(null,Array(65)).map(String.prototype.valueOf,""),r=[],v,i,m=['default','shift','ctrl','shift-ctrl','alt','shift-alt','ctrl-alt','shift-ctrl-alt'];for(i=m.length-1;i>=0;i--)if((v=x[m[i]])||r.length)r=(v?v:e).slice().concat(r);return r})(this.KV.KLS);this.KDU=0;this.KH='';this.KM=0;this.KBVER="1.0";this.KMBM=0x0000;this.KVKL={"phone":{"font":"Tahoma","displayUnderlying":false,"layer":[{"id":"default","row":[{"id":"1","key":[{"id":"K_7","text":"7"},{"id":"K_8","text":"8","hint":"abc","multitap":[{"id":"K_A","text":"a"},{"id":"K_B","text":"b"},{"id":"K_C","text":"c"},{"nextlayer":"shift","layer":"shift","id":"K_A","text":"A"},{"nextlayer":"shift","layer":"shift","id":"K_B","text":"B"},{"nextlayer":"shift","layer":"shift","id":"K_C","text":"C"}]},{"id":"K_9","text":"9","hint":"def","multitap":[{"id":"K_D","text":"d"},{"id":"K_E","text":"e"},{"id":"K_F","text":"f"},{"nextlayer":"shift","layer":"shift","id":"K_D","text":"D"},{"nextlayer":"shift","layer":"shift","id":"K_E","text":"E"},{"nextlayer":"shift","layer":"shift","id":"K_F","text":"F"}]},{"width":"100","id":"K_BKSP","sp":"1","text":"*BkSp*"}]},{"id":"2","key":[{"id":"K_4","text":"4","hint":"ghi","multitap":[{"id":"K_G","text":"g"},{"id":"K_H","text":"h"},{"id":"K_I","text":"i"},{"nextlayer":"shift","layer":"shift","id":"K_G","text":"G"},{"nextlayer":"shift","layer":"shift","id":"K_H","text":"H"},{"nextlayer":"shift","layer":"shift","id":"K_I","text":"I"}]},{"id":"K_5","text":"5","hint":"jkl","multitap":[{"id":"K_J","text":"j"},{"id":"K_K","text":"k"},{"id":"K_L","text":"l"},{"nextlayer":"shift","layer":"shift","id":"K_J","text":"J"},{"nextlayer":"shift","layer":"shift","id":"K_K","text":"K"},{"nextlayer":"shift","layer":"shift","id":"K_L","text":"L"}]},{"id":"K_6","text":"6","hint":"mno","multitap":[{"id":"K_M","text":"m"},{"id":"K_N","text":"n"},{"id":"K_O","text":"o"},{"nextlayer":"shift","layer":"shift","id":"K_M","text":"M"},{"nextlayer":"shift","layer":"shift","id":"K_N","text":"N"},{"nextlayer":"shift","layer":"shift","id":"K_O","text":"O"}]},{"width":"120","id":"K_LOPT","sp":"1","text":"*Menu*"}]},{"id":"3","key":[{"id":"K_1","text":"1","hint":"pqrs","multitap":[{"id":"K_P","text":"p"},{"id":"K_Q","text":"q"},{"id":"K_R","text":"r"},{"id":"K_S","text":"s"},{"nextlayer":"shift","layer":"shift","id":"K_P","text":"P"},{"nextlayer":"shift","layer":"shift","id":"K_Q","text":"Q"},{"nextlayer":"shift","layer":"shift","id":"K_R","text":"R"},{"nextlayer":"shift","layer":"shift","id":"K_S","text":"S"}]},{"id":"K_2","text":"2","hint":"tuv","multitap":[{"id":"K_T","text":"t"},{"id":"K_U","text":"u"},{"id":"K_V","text":"v"},{"nextlayer":"shift","layer":"shift","id":"K_T","text":"T"},{"nextlayer":"shift","layer":"shift","id":"K_U","text":"U"},{"nextlayer":"shift","layer":"shift","id":"K_V","text":"V"}]},{"id":"K_3","text":"3","hint":"wxyz","multitap":[{"id":"K_W","text":"w"},{"id":"K_X","text":"x"},{"id":"K_Y","text":"y"},{"id":"K_Z","text":"z"},{"nextlayer":"shift","layer":"shift","id":"K_W","text":"W"},{"nextlayer":"shift","layer":"shift","id":"K_X","text":"X"},{"nextlayer":"shift","layer":"shift","id":"K_Y","text":"Y"},{"nextlayer":"shift","layer":"shift","id":"K_Z","text":"Z"}]},{"width":"150","id":"K_ENTER","sp":"1","text":"*Enter*"}]},{"id":"4","key":[{"nextlayer":"shift","width":"100","id":"K_SHIFT","sp":"1","text":"*Shift*"},{"id":"K_0","text":"0"},{"width":"250","id":"K_SPACE"}]}]},{"id":"shift","row":[{"id":"1","key":[{"id":"K_7","text":"7"},{"id":"K_8","text":"8","hint":"ABC","multitap":[{"id":"K_A","text":"A"},{"id":"K_B","text":"B"},{"id":"K_C","text":"C"},{"nextlayer":"default","layer":"default","id":"K_A","text":"a"},{"nextlayer":"default","layer":"default","id":"K_B","text":"b"},{"nextlayer":"default","layer":"default","id":"K_C","text":"c"}]},{"id":"K_9","text":"9","hint":"DEF","multitap":[{"id":"K_D","text":"D"},{"id":"K_E","text":"E"},{"id":"K_F","text":"F"},{"nextlayer":"default","layer":"default","id":"K_D","text":"d"},{"nextlayer":"default","layer":"default","id":"K_E","text":"e"},{"nextlayer":"default","layer":"default","id":"K_F","text":"f"}]},{"width":"100","id":"K_BKSP","sp":"1","text":"*BkSp*"}]},{"id":"2","key":[{"id":"K_4","text":"4","hint":"GHI","multitap":[{"id":"K_G","text":"G"},{"id":"K_H","text":"H"},{"id":"K_I","text":"I"},{"nextlayer":"default","layer":"default","id":"K_G","text":"g"},{"nextlayer":"default","layer":"default","id":"K_H","text":"h"},{"nextlayer":"default","layer":"default","id":"K_I","text":"i"}]},{"id":"K_5","text":"5","hint":"JKL","multitap":[{"id":"K_J","text":"J"},{"id":"K_K","text":"K"},{"id":"K_L","text":"L"},{"nextlayer":"default","layer":"default","id":"K_J","text":"j"},{"nextlayer":"default","layer":"default","id":"K_K","text":"k"},{"nextlayer":"default","layer":"default","id":"K_L","text":"l"}]},{"id":"K_6","text":"6","hint":"MNO","multitap":[{"id":"K_M","text":"M"},{"id":"K_N","text":"N"},{"id":"K_O","text":"O"},{"nextlayer":"default","layer":"default","id":"K_M","text":"m"},{"nextlayer":"default","layer":"default","id":"K_N","text":"n"},{"nextlayer":"default","layer":"default","id":"K_O","text":"o"}]},{"width":"120","id":"K_LOPT","sp":"1","text":"*Menu*"}]},{"id":"3","key":[{"id":"K_1","text":"1","hint":"PQRS","multitap":[{"id":"K_P","text":"P"},{"id":"K_Q","text":"Q"},{"id":"K_R","text":"R"},{"id":"K_S","text":"S"},{"nextlayer":"default","layer":"default","id":"K_P","text":"p"},{"nextlayer":"default","layer":"default","id":"K_Q","text":"q"},{"nextlayer":"default","layer":"default","id":"K_R","text":"r"},{"nextlayer":"default","layer":"default","id":"K_S","text":"s"}]},{"id":"K_2","text":"2","hint":"TUV","multitap":[{"id":"K_T","text":"T"},{"id":"K_U","text":"U"},{"id":"K_V","text":"V"},{"nextlayer":"default","layer":"default","id":"K_T","text":"t"},{"nextlayer":"default","layer":"default","id":"K_U","text":"u"},{"nextlayer":"default","layer":"default","id":"K_V","text":"v"}]},{"id":"K_3","text":"3","hint":"WXYZ","multitap":[{"id":"K_W","text":"W"},{"id":"K_X","text":"X"},{"id":"K_Y","text":"Y"},{"id":"K_Z","text":"Z"},{"nextlayer":"default","layer":"default","id":"K_W","text":"w"},{"nextlayer":"default","layer":"default","id":"K_X","text":"x"},{"nextlayer":"default","layer":"default","id":"K_Y","text":"y"},{"nextlayer":"default","layer":"default","id":"K_Z","text":"z"}]},{"width":"150","id":"K_ENTER","sp":"1","text":"*Enter*"}]},{"id":"4","key":[{"nextlayer":"default","width":"100","id":"K_SHIFT","sp":"1","text":"*Shifted*"},{"id":"K_0","text":"0"},{"width":"250","id":"K_SPACE"}]}]}]}};this.KVER="17.0.185.0";this.KVS=[];this.gs=function(t,e) {return this.g0(t,e);};this.gs=function(t,e) {return this.g0(t,e);};this.g0=function(t,e) {var k=KeymanWeb,r=0,m=0;return r;};}