if(typeof keyman === 'undefined') {console.log('Keyboard requires KeymanWeb 10.0 or later');if(typeof tavultesoft !== 'undefined') tavultesoft.keymanweb.util.alert("This keyboard requires KeymanWeb 10.0 or later");} else {KeymanWeb.KR(new Keyboard_ye_old_ten_key());}function Keyboard_ye_old_ten_key(){this._v=(typeof keyman!="undefined"&&typeof keyman.version=="string")?parseInt(keyman.version,10):9;this.KI="Keyboard_ye_old_ten_key";this.KN="ye_old_ten_key";this.KMINVER="10.0";this.KV={F:' 1em "Arial"',K102:0};this.KV.KLS={};this.KV.BK=(function(x){var e=Array.apply(null,Array(65)).map(String.prototype.valueOf,""),r=[],v,i,m=['default','shift','ctrl','shift-ctrl','alt','shift-alt','ctrl-alt','shift-ctrl-alt'];for(i=m.length-1;i>=0;i--)if((v=x[m[i]])||r.length)r=(v?v:e).slice().concat(r);return r})(this.KV.KLS);this.KDU=0;this.KH='';this.KM=0;this.KBVER="1.0";this.KMBM=0x0;this.KVKL={"phone":{"font":"Tahoma","layer":[{"id":"default","row":[{"id":"1","key":[{"id":"K_7","text":"7"},{"id":"K_8","text":"8","hint":"abc","multitap":[{"text":"a","id":"K_A"},{"text":"b","id":"K_B"},{"text":"c","id":"K_C"},{"text":"A","id":"K_A","nextlayer":"shift","layer":"shift"},{"text":"B","id":"K_B","nextlayer":"shift","layer":"shift"},{"text":"C","id":"K_C","nextlayer":"shift","layer":"shift"}]},{"id":"K_9","text":"9","hint":"def","multitap":[{"text":"d","id":"K_D"},{"text":"e","id":"K_E"},{"text":"f","id":"K_F"},{"text":"D","id":"K_D","nextlayer":"shift","layer":"shift"},{"text":"E","id":"K_E","nextlayer":"shift","layer":"shift"},{"text":"F","id":"K_F","nextlayer":"shift","layer":"shift"}]},{"id":"K_BKSP","text":"*BkSp*","width":"100","sp":"1"}]},{"id":"2","key":[{"id":"K_4","text":"4","hint":"ghi","multitap":[{"text":"g","id":"K_G"},{"text":"h","id":"K_H"},{"text":"i","id":"K_I"},{"text":"G","id":"K_G","nextlayer":"shift","layer":"shift"},{"text":"H","id":"K_H","nextlayer":"shift","layer":"shift"},{"text":"I","id":"K_I","nextlayer":"shift","layer":"shift"}]},{"id":"K_5","text":"5","hint":"jkl","multitap":[{"text":"j","id":"K_J"},{"text":"k","id":"K_K"},{"text":"l","id":"K_L"},{"text":"J","id":"K_J","nextlayer":"shift","layer":"shift"},{"text":"K","id":"K_K","nextlayer":"shift","layer":"shift"},{"text":"L","id":"K_L","nextlayer":"shift","layer":"shift"}]},{"id":"K_6","text":"6","hint":"mno","multitap":[{"text":"m","id":"K_M"},{"text":"n","id":"K_N"},{"text":"o","id":"K_O"},{"text":"M","id":"K_M","nextlayer":"shift","layer":"shift"},{"text":"N","id":"K_N","nextlayer":"shift","layer":"shift"},{"text":"O","id":"K_O","nextlayer":"shift","layer":"shift"}]},{"id":"K_LOPT","text":"*Menu*","width":"120","sp":"1"}]},{"id":"3","key":[{"id":"K_1","text":"1","hint":"pqrs","multitap":[{"text":"p","id":"K_P"},{"text":"q","id":"K_Q"},{"text":"r","id":"K_R"},{"text":"s","id":"K_S"},{"text":"P","id":"K_P","nextlayer":"shift","layer":"shift"},{"text":"Q","id":"K_Q","nextlayer":"shift","layer":"shift"},{"text":"R","id":"K_R","nextlayer":"shift","layer":"shift"},{"text":"S","id":"K_S","nextlayer":"shift","layer":"shift"}]},{"id":"K_2","text":"2","hint":"tuv","multitap":[{"text":"t","id":"K_T"},{"text":"u","id":"K_U"},{"text":"v","id":"K_V"},{"text":"T","id":"K_T","nextlayer":"shift","layer":"shift"},{"text":"U","id":"K_U","nextlayer":"shift","layer":"shift"},{"text":"V","id":"K_V","nextlayer":"shift","layer":"shift"}]},{"id":"K_3","text":"3","hint":"wxyz","multitap":[{"text":"w","id":"K_W"},{"text":"x","id":"K_X"},{"text":"y","id":"K_Y"},{"text":"z","id":"K_Z"},{"text":"W","id":"K_W","nextlayer":"shift","layer":"shift"},{"text":"X","id":"K_X","nextlayer":"shift","layer":"shift"},{"text":"Y","id":"K_Y","nextlayer":"shift","layer":"shift"},{"text":"Z","id":"K_Z","nextlayer":"shift","layer":"shift"}]},{"id":"K_ENTER","text":"*Enter*","width":"150","sp":"1"}]},{"id":"4","key":[{"id":"K_SHIFT","text":"*Shift*","width":"100","sp":"1","nextlayer":"shift"},{"id":"K_0","text":"0"},{"id":"K_SPACE","width":"250"}]}]},{"id":"shift","row":[{"id":"1","key":[{"id":"K_7","text":"7","layer":"default"},{"id":"K_8","text":"8","layer":"default","hint":"ABC","multitap":[{"text":"A","id":"K_A"},{"text":"B","id":"K_B"},{"text":"C","id":"K_C"},{"text":"a","id":"K_A","nextlayer":"default","layer":"default"},{"text":"b","id":"K_B","nextlayer":"default","layer":"default"},{"text":"c","id":"K_C","nextlayer":"default","layer":"default"}]},{"id":"K_9","text":"9","layer":"default","hint":"DEF","multitap":[{"text":"D","id":"K_D"},{"text":"E","id":"K_E"},{"text":"F","id":"K_F"},{"text":"d","id":"K_D","nextlayer":"default","layer":"default"},{"text":"e","id":"K_E","nextlayer":"default","layer":"default"},{"text":"f","id":"K_F","nextlayer":"default","layer":"default"}]},{"id":"K_BKSP","text":"*BkSp*","width":"100","sp":"1"}]},{"id":"2","key":[{"id":"K_4","text":"4","layer":"default","hint":"GHI","multitap":[{"text":"G","id":"K_G"},{"text":"H","id":"K_H"},{"text":"I","id":"K_I"},{"text":"g","id":"K_G","nextlayer":"default","layer":"default"},{"text":"h","id":"K_H","nextlayer":"default","layer":"default"},{"text":"i","id":"K_I","nextlayer":"default","layer":"default"}]},{"id":"K_5","text":"5","layer":"default","hint":"JKL","multitap":[{"text":"J","id":"K_J"},{"text":"K","id":"K_K"},{"text":"L","id":"K_L"},{"text":"j","id":"K_J","nextlayer":"default","layer":"default"},{"text":"k","id":"K_K","nextlayer":"default","layer":"default"},{"text":"l","id":"K_L","nextlayer":"default","layer":"default"}]},{"id":"K_6","text":"6","layer":"default","hint":"MNO","multitap":[{"text":"M","id":"K_M"},{"text":"N","id":"K_N"},{"text":"O","id":"K_O"},{"text":"m","id":"K_M","nextlayer":"default","layer":"default"},{"text":"n","id":"K_N","nextlayer":"default","layer":"default"},{"text":"o","id":"K_O","nextlayer":"default","layer":"default"}]},{"id":"K_LOPT","text":"*Menu*","width":"120","sp":"1"}]},{"id":"3","key":[{"id":"K_1","text":"1","layer":"default","hint":"PQRS","multitap":[{"text":"P","id":"K_P"},{"text":"Q","id":"K_Q"},{"text":"R","id":"K_R"},{"text":"S","id":"K_S"},{"text":"p","id":"K_P","nextlayer":"default","layer":"default"},{"text":"q","id":"K_Q","nextlayer":"default","layer":"default"},{"text":"r","id":"K_R","nextlayer":"default","layer":"default"},{"text":"s","id":"K_S","nextlayer":"default","layer":"default"}]},{"id":"K_2","text":"2","layer":"default","hint":"TUV","multitap":[{"text":"T","id":"K_T"},{"text":"U","id":"K_U"},{"text":"V","id":"K_V"},{"text":"t","id":"K_T","nextlayer":"default","layer":"default"},{"text":"u","id":"K_U","nextlayer":"default","layer":"default"},{"text":"v","id":"K_V","nextlayer":"default","layer":"default"}]},{"id":"K_3","text":"3","layer":"default","hint":"WXYZ","multitap":[{"text":"W","id":"K_W"},{"text":"X","id":"K_X"},{"text":"Y","id":"K_Y"},{"text":"Z","id":"K_Z"},{"text":"w","id":"K_W","nextlayer":"default","layer":"default"},{"text":"x","id":"K_X","nextlayer":"default","layer":"default"},{"text":"y","id":"K_Y","nextlayer":"default","layer":"default"},{"text":"z","id":"K_Z","nextlayer":"default","layer":"default"}]},{"id":"K_ENTER","text":"*Enter*","width":"150","sp":"1"}]},{"id":"4","key":[{"id":"K_SHIFT","text":"*Shift*","width":"100","sp":"2","nextlayer":"default"},{"id":"K_0","text":"0"},{"id":"K_SPACE","width":"250"}]}]}],"displayUnderlying":false}};this.KVER="17.0.219.0";this.KVS=[];this.gs=function(t,e) {return this.g0(t,e);};this.gs=function(t,e) {return this.g0(t,e);};this.g0=function(t,e) {var k=KeymanWeb,r=0,m=0;return r;};}