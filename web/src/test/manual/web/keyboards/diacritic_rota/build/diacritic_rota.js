if(typeof keyman === 'undefined') {console.log('Keyboard requires KeymanWeb 10.0 or later');if(typeof tavultesoft !== 'undefined') tavultesoft.keymanweb.util.alert("This keyboard requires KeymanWeb 10.0 or later");} else {KeymanWeb.KR(new Keyboard_diacritic_rota());}function Keyboard_diacritic_rota(){this._v=(typeof keyman!="undefined"&&typeof keyman.version=="string")?parseInt(keyman.version,10):9;this.KI="Keyboard_diacritic_rota";this.KN="Diacritic 10-key Rota";this.KMINVER="14.0";this.KV={F:' 1em "Arial"',K102:0};this.KV.KLS={};this.KV.BK=(function(x){var e=Array.apply(null,Array(65)).map(String.prototype.valueOf,""),r=[],v,i,m=['default','shift','ctrl','shift-ctrl','alt','shift-alt','ctrl-alt','shift-ctrl-alt'];for(i=m.length-1;i>=0;i--)if((v=x[m[i]])||r.length)r=(v?v:e).slice().concat(r);return r})(this.KV.KLS);this.KDU=0;this.KH='';this.KM=0;this.KBVER="1.0";this.KMBM=0x10;this.KVKD="T_DK_DIA_GRAVE T_DK_DIA_ACUTE T_DK_DIA_CIRCUM";this.KVKL={"phone":{"font":"Tahoma","layer":[{"id":"default","row":[{"id":"1","key":[{"id":"K_7","text":"7"},{"id":"K_8","text":"8","hint":"abc","multitap":[{"text":"a","id":"K_A"},{"text":"b","id":"K_B"},{"text":"c","id":"K_C"},{"text":"A","id":"K_A","nextlayer":"shift","layer":"shift"},{"text":"B","id":"K_B","nextlayer":"shift","layer":"shift"},{"text":"C","id":"K_C","nextlayer":"shift","layer":"shift"}]},{"id":"K_9","text":"9","hint":"def","multitap":[{"text":"d","id":"K_D"},{"text":"e","id":"K_E"},{"text":"f","id":"K_F"},{"text":"D","id":"K_D","nextlayer":"shift","layer":"shift"},{"text":"E","id":"K_E","nextlayer":"shift","layer":"shift"},{"text":"F","id":"K_F","nextlayer":"shift","layer":"shift"}]},{"id":"K_BKSP","text":"*BkSp*","width":"100","sp":"1"}]},{"id":"2","key":[{"id":"K_4","text":"4","hint":"ghi","multitap":[{"text":"g","id":"K_G"},{"text":"h","id":"K_H"},{"text":"i","id":"K_I"},{"text":"G","id":"K_G","nextlayer":"shift","layer":"shift"},{"text":"H","id":"K_H","nextlayer":"shift","layer":"shift"},{"text":"I","id":"K_I","nextlayer":"shift","layer":"shift"}]},{"id":"K_5","text":"5","hint":"jkl","multitap":[{"text":"j","id":"K_J"},{"text":"k","id":"K_K"},{"text":"l","id":"K_L"},{"text":"J","id":"K_J","nextlayer":"shift","layer":"shift"},{"text":"K","id":"K_K","nextlayer":"shift","layer":"shift"},{"text":"L","id":"K_L","nextlayer":"shift","layer":"shift"}]},{"id":"K_6","text":"6","hint":"mno","multitap":[{"text":"m","id":"K_M"},{"text":"n","id":"K_N"},{"text":"o","id":"K_O"},{"text":"M","id":"K_M","nextlayer":"shift","layer":"shift"},{"text":"N","id":"K_N","nextlayer":"shift","layer":"shift"},{"text":"O","id":"K_O","nextlayer":"shift","layer":"shift"}]},{"id":"T_DK_DIA_GRAVE","text":"◌̀","hint":"◌́◌̂","multitap":[{"text":"◌́","id":"T_DK_DIA_ACUTE"},{"text":"◌̂","id":"T_DK_DIA_CIRCUM"}]}]},{"id":"3","key":[{"id":"K_1","text":"1","hint":"pqrs","multitap":[{"text":"p","id":"K_P"},{"text":"q","id":"K_Q"},{"text":"r","id":"K_R"},{"text":"s","id":"K_S"},{"text":"P","id":"K_P","nextlayer":"shift","layer":"shift"},{"text":"Q","id":"K_Q","nextlayer":"shift","layer":"shift"},{"text":"R","id":"K_R","nextlayer":"shift","layer":"shift"},{"text":"S","id":"K_S","nextlayer":"shift","layer":"shift"}]},{"id":"K_2","text":"2","hint":"tuv","multitap":[{"text":"t","id":"K_T"},{"text":"u","id":"K_U"},{"text":"v","id":"K_V"},{"text":"T","id":"K_T","nextlayer":"shift","layer":"shift"},{"text":"U","id":"K_U","nextlayer":"shift","layer":"shift"},{"text":"V","id":"K_V","nextlayer":"shift","layer":"shift"}]},{"id":"K_3","text":"3","hint":"wxyz","multitap":[{"text":"w","id":"K_W"},{"text":"x","id":"K_X"},{"text":"y","id":"K_Y"},{"text":"z","id":"K_Z"},{"text":"W","id":"K_W","nextlayer":"shift","layer":"shift"},{"text":"X","id":"K_X","nextlayer":"shift","layer":"shift"},{"text":"Y","id":"K_Y","nextlayer":"shift","layer":"shift"},{"text":"Z","id":"K_Z","nextlayer":"shift","layer":"shift"}]},{"id":"K_ENTER","text":"*Enter*","width":"100","sp":"1"}]},{"id":"4","key":[{"id":"K_SHIFT","text":"*Shift*","width":"100","sp":"1","nextlayer":"shift"},{"id":"K_0","text":"0"},{"id":"K_PERIOD","text":".","sk":[{"id":"K_COMMA","text":","},{"id":"U_0021"},{"id":"U_003F"},{"id":"U_0027"},{"id":"U_0022"},{"id":"U_005C"},{"id":"U_003A"},{"id":"U_003B"}]},{"id":"T_BLANK","sp":"10"}]},{"id":"5","key":[{"id":"K_LOPT","text":"*Menu*","width":"120","sp":"1"},{"id":"K_SPACE","width":"250"}]}]},{"id":"shift","row":[{"id":"1","key":[{"id":"K_7","text":"7","layer":"default"},{"id":"K_8","text":"8","layer":"default","hint":"ABC","multitap":[{"text":"A","id":"K_A"},{"text":"B","id":"K_B"},{"text":"C","id":"K_C"},{"text":"a","id":"K_A","nextlayer":"default","layer":"default"},{"text":"b","id":"K_B","nextlayer":"default","layer":"default"},{"text":"c","id":"K_C","nextlayer":"default","layer":"default"}]},{"id":"K_9","text":"9","layer":"default","hint":"DEF","multitap":[{"text":"D","id":"K_D"},{"text":"E","id":"K_E"},{"text":"F","id":"K_F"},{"text":"d","id":"K_D","nextlayer":"default","layer":"default"},{"text":"e","id":"K_E","nextlayer":"default","layer":"default"},{"text":"f","id":"K_F","nextlayer":"default","layer":"default"}]},{"id":"K_BKSP","text":"*BkSp*","width":"100","sp":"1"}]},{"id":"2","key":[{"id":"K_4","text":"4","layer":"default","hint":"GHI","multitap":[{"text":"G","id":"K_G"},{"text":"H","id":"K_H"},{"text":"I","id":"K_I"},{"text":"g","id":"K_G","nextlayer":"default","layer":"default"},{"text":"h","id":"K_H","nextlayer":"default","layer":"default"},{"text":"i","id":"K_I","nextlayer":"default","layer":"default"}]},{"id":"K_5","text":"5","layer":"default","hint":"JKL","multitap":[{"text":"J","id":"K_J"},{"text":"K","id":"K_K"},{"text":"L","id":"K_L"},{"text":"j","id":"K_J","nextlayer":"default","layer":"default"},{"text":"k","id":"K_K","nextlayer":"default","layer":"default"},{"text":"l","id":"K_L","nextlayer":"default","layer":"default"}]},{"id":"K_6","text":"6","layer":"default","hint":"MNO","multitap":[{"text":"M","id":"K_M"},{"text":"N","id":"K_N"},{"text":"O","id":"K_O"},{"text":"m","id":"K_M","nextlayer":"default","layer":"default"},{"text":"n","id":"K_N","nextlayer":"default","layer":"default"},{"text":"o","id":"K_O","nextlayer":"default","layer":"default"}]},{"id":"T_DK_DIA_GRAVE","text":"◌̀","hint":"◌́◌̂","multitap":[{"text":"◌́","id":"T_DK_DIA_ACUTE"},{"text":"◌̂","id":"T_DK_DIA_CIRCUM"}]}]},{"id":"3","key":[{"id":"K_1","text":"1","layer":"default","hint":"PQRS","multitap":[{"text":"P","id":"K_P"},{"text":"Q","id":"K_Q"},{"text":"R","id":"K_R"},{"text":"S","id":"K_S"},{"text":"p","id":"K_P","nextlayer":"default","layer":"default"},{"text":"q","id":"K_Q","nextlayer":"default","layer":"default"},{"text":"r","id":"K_R","nextlayer":"default","layer":"default"},{"text":"s","id":"K_S","nextlayer":"default","layer":"default"}]},{"id":"K_2","text":"2","layer":"default","hint":"TUV","multitap":[{"text":"T","id":"K_T"},{"text":"U","id":"K_U"},{"text":"V","id":"K_V"},{"text":"t","id":"K_T","nextlayer":"default","layer":"default"},{"text":"u","id":"K_U","nextlayer":"default","layer":"default"},{"text":"v","id":"K_V","nextlayer":"default","layer":"default"}]},{"id":"K_3","text":"3","layer":"default","hint":"WXYZ","multitap":[{"text":"W","id":"K_W"},{"text":"X","id":"K_X"},{"text":"Y","id":"K_Y"},{"text":"Z","id":"K_Z"},{"text":"w","id":"K_W","nextlayer":"default","layer":"default"},{"text":"x","id":"K_X","nextlayer":"default","layer":"default"},{"text":"y","id":"K_Y","nextlayer":"default","layer":"default"},{"text":"z","id":"K_Z","nextlayer":"default","layer":"default"}]},{"id":"K_ENTER","text":"*Enter*","width":"100","sp":"1"}]},{"id":"4","key":[{"id":"K_SHIFT","text":"*Shift*","width":"100","sp":"2","nextlayer":"default"},{"id":"K_0","text":"0","layer":"default"},{"id":"K_PERIOD","text":".","sk":[{"id":"K_COMMA","text":","},{"id":"U_0021"},{"id":"U_003F"},{"id":"U_0027"},{"id":"U_0022"},{"id":"U_005C"},{"id":"U_003A"},{"id":"U_003B"}]},{"id":"T_BLANK","sp":"10"}]},{"id":"5","key":[{"id":"K_LOPT","text":"*Menu*","width":"120","sp":"1"},{"id":"K_SPACE","width":"250"}]}]}],"displayUnderlying":false}};this.s11=['','','','','','','','','','','','','','','','','','','','','','','','','',''];this.s12=['','','','','','','','','','','','','','','','','','','','','','','','','',''];this.s13="abcdefghijklmnopqrstuvwxyz";this.s14="ABCDEFGHIJKLMNOPQRSTUVWXYZ";this.s15="àbcdèfghìjklmǹòpqrstùvẁxỳz";this.s16="ÀBCDÈFGHÌJKLMǸÒPQRSTÙVẀXỲZ";this.s17="ábćdéfǵhíjḱĺḿńóṕqŕśtúvẃxýź";this.s18="ÁBĆDÉFǴHÍJḰĹḾŃÓṔQŔŚTÚVẂXÝŹ";this.s19="âbĉdêfĝĥîĵklmnôpqrŝtûvŵxŷẑ";this.s20="ÂBĈDÊFĜĤÎĴKLMNÔPQRŜTÛVŴXŶẐ";this.s21="̀́̂";this.s22=[{t:'d',d:0},{t:'d',d:1},{t:'d',d:2}];this.KVER="17.0.216.0";this.KVS=[];this.gs=function(t,e) {return this.g0(t,e);};this.gs=function(t,e) {return this.g0(t,e);};this.g0=function(t,e) {var k=KeymanWeb,r=0,m=0;if(k.KKM(e,16384,256)) {if(1){r=m=1;k.KDC(0,t);k.KO(-1,t,"̀");k.KDO(-1,t,0);}}else if(k.KKM(e,16384,257)) {if(1){r=m=1;k.KDC(0,t);k.KO(-1,t,"́");k.KDO(-1,t,1);}}else if(k.KKM(e,16384,258)) {if(1){r=m=1;k.KDC(0,t);k.KO(-1,t,"̂");k.KDO(-1,t,2);}}else if(k.KKM(e,16400,256)) {if(1){r=m=1;k.KDC(0,t);k.KO(-1,t,"̀");k.KDO(-1,t,0);}}else if(k.KKM(e,16400,257)) {if(1){r=m=1;k.KDC(0,t);k.KO(-1,t,"́");k.KDO(-1,t,1);}}else if(k.KKM(e,16400,258)) {if(1){r=m=1;k.KDC(0,t);k.KO(-1,t,"̂");k.KDO(-1,t,2);}}else if(k.KKM(e,16384,32)) {if(k.KFCM(2,t,[{t:'a',a:this.s21},{t:'a',a:this.s22}])){r=m=1;k.KDC(2,t);k.KO(-1,t," ");}}else if(k.KKM(e,16400,32)) {if(k.KFCM(2,t,[{t:'a',a:this.s21},{t:'a',a:this.s22}])){r=m=1;k.KDC(2,t);k.KO(-1,t," ");}}else if(k.KKM(e,16400,65)) {if(1){r=m=1;k.KDC(0,t);k.KO(-1,t,"A");}}else if(k.KKM(e,16400,66)) {if(1){r=m=1;k.KDC(0,t);k.KO(-1,t,"B");}}else if(k.KKM(e,16400,67)) {if(1){r=m=1;k.KDC(0,t);k.KO(-1,t,"C");}}else if(k.KKM(e,16400,68)) {if(1){r=m=1;k.KDC(0,t);k.KO(-1,t,"D");}}else if(k.KKM(e,16400,69)) {if(1){r=m=1;k.KDC(0,t);k.KO(-1,t,"E");}}else if(k.KKM(e,16400,70)) {if(1){r=m=1;k.KDC(0,t);k.KO(-1,t,"F");}}else if(k.KKM(e,16400,71)) {if(1){r=m=1;k.KDC(0,t);k.KO(-1,t,"G");}}else if(k.KKM(e,16400,72)) {if(1){r=m=1;k.KDC(0,t);k.KO(-1,t,"H");}}else if(k.KKM(e,16400,73)) {if(1){r=m=1;k.KDC(0,t);k.KO(-1,t,"I");}}else if(k.KKM(e,16400,74)) {if(1){r=m=1;k.KDC(0,t);k.KO(-1,t,"J");}}else if(k.KKM(e,16400,75)) {if(1){r=m=1;k.KDC(0,t);k.KO(-1,t,"K");}}else if(k.KKM(e,16400,76)) {if(1){r=m=1;k.KDC(0,t);k.KO(-1,t,"L");}}else if(k.KKM(e,16400,77)) {if(1){r=m=1;k.KDC(0,t);k.KO(-1,t,"M");}}else if(k.KKM(e,16400,78)) {if(1){r=m=1;k.KDC(0,t);k.KO(-1,t,"N");}}else if(k.KKM(e,16400,79)) {if(1){r=m=1;k.KDC(0,t);k.KO(-1,t,"O");}}else if(k.KKM(e,16400,80)) {if(1){r=m=1;k.KDC(0,t);k.KO(-1,t,"P");}}else if(k.KKM(e,16400,81)) {if(1){r=m=1;k.KDC(0,t);k.KO(-1,t,"Q");}}else if(k.KKM(e,16400,82)) {if(1){r=m=1;k.KDC(0,t);k.KO(-1,t,"R");}}else if(k.KKM(e,16400,83)) {if(1){r=m=1;k.KDC(0,t);k.KO(-1,t,"S");}}else if(k.KKM(e,16400,84)) {if(1){r=m=1;k.KDC(0,t);k.KO(-1,t,"T");}}else if(k.KKM(e,16400,85)) {if(1){r=m=1;k.KDC(0,t);k.KO(-1,t,"U");}}else if(k.KKM(e,16400,86)) {if(1){r=m=1;k.KDC(0,t);k.KO(-1,t,"V");}}else if(k.KKM(e,16400,87)) {if(1){r=m=1;k.KDC(0,t);k.KO(-1,t,"W");}}else if(k.KKM(e,16400,88)) {if(1){r=m=1;k.KDC(0,t);k.KO(-1,t,"X");}}else if(k.KKM(e,16400,89)) {if(1){r=m=1;k.KDC(0,t);k.KO(-1,t,"Y");}}else if(k.KKM(e,16400,90)) {if(1){r=m=1;k.KDC(0,t);k.KO(-1,t,"Z");}}else if(k.KKM(e,16384,65)) {if(1){r=m=1;k.KDC(0,t);k.KO(-1,t,"a");}}else if(k.KKM(e,16384,66)) {if(1){r=m=1;k.KDC(0,t);k.KO(-1,t,"b");}}else if(k.KKM(e,16384,67)) {if(1){r=m=1;k.KDC(0,t);k.KO(-1,t,"c");}}else if(k.KKM(e,16384,68)) {if(1){r=m=1;k.KDC(0,t);k.KO(-1,t,"d");}}else if(k.KKM(e,16384,69)) {if(1){r=m=1;k.KDC(0,t);k.KO(-1,t,"e");}}else if(k.KKM(e,16384,70)) {if(1){r=m=1;k.KDC(0,t);k.KO(-1,t,"f");}}else if(k.KKM(e,16384,71)) {if(1){r=m=1;k.KDC(0,t);k.KO(-1,t,"g");}}else if(k.KKM(e,16384,72)) {if(1){r=m=1;k.KDC(0,t);k.KO(-1,t,"h");}}else if(k.KKM(e,16384,73)) {if(1){r=m=1;k.KDC(0,t);k.KO(-1,t,"i");}}else if(k.KKM(e,16384,74)) {if(1){r=m=1;k.KDC(0,t);k.KO(-1,t,"j");}}else if(k.KKM(e,16384,75)) {if(1){r=m=1;k.KDC(0,t);k.KO(-1,t,"k");}}else if(k.KKM(e,16384,76)) {if(1){r=m=1;k.KDC(0,t);k.KO(-1,t,"l");}}else if(k.KKM(e,16384,77)) {if(1){r=m=1;k.KDC(0,t);k.KO(-1,t,"m");}}else if(k.KKM(e,16384,78)) {if(1){r=m=1;k.KDC(0,t);k.KO(-1,t,"n");}}else if(k.KKM(e,16384,79)) {if(1){r=m=1;k.KDC(0,t);k.KO(-1,t,"o");}}else if(k.KKM(e,16384,80)) {if(1){r=m=1;k.KDC(0,t);k.KO(-1,t,"p");}}else if(k.KKM(e,16384,81)) {if(1){r=m=1;k.KDC(0,t);k.KO(-1,t,"q");}}else if(k.KKM(e,16384,82)) {if(1){r=m=1;k.KDC(0,t);k.KO(-1,t,"r");}}else if(k.KKM(e,16384,83)) {if(1){r=m=1;k.KDC(0,t);k.KO(-1,t,"s");}}else if(k.KKM(e,16384,84)) {if(1){r=m=1;k.KDC(0,t);k.KO(-1,t,"t");}}else if(k.KKM(e,16384,85)) {if(1){r=m=1;k.KDC(0,t);k.KO(-1,t,"u");}}else if(k.KKM(e,16384,86)) {if(1){r=m=1;k.KDC(0,t);k.KO(-1,t,"v");}}else if(k.KKM(e,16384,87)) {if(1){r=m=1;k.KDC(0,t);k.KO(-1,t,"w");}}else if(k.KKM(e,16384,88)) {if(1){r=m=1;k.KDC(0,t);k.KO(-1,t,"x");}}else if(k.KKM(e,16384,89)) {if(1){r=m=1;k.KDC(0,t);k.KO(-1,t,"y");}}else if(k.KKM(e,16384,90)) {if(1){r=m=1;k.KDC(0,t);k.KO(-1,t,"z");}}if(m==1) {k.KDC(-1,t);r=this.g1(t,e);m=2;}return r;};this.g1=function(t,e) {var k=KeymanWeb,r=1,m=0;if(k.KFCM(3,t,['̀',{t:'d',d:0},{t:'a',a:this.s13}])){m=1;k.KDC(3,t);k.KIO(-1,this.s15,3,t);}else if(k.KFCM(3,t,['́',{t:'d',d:1},{t:'a',a:this.s13}])){m=1;k.KDC(3,t);k.KIO(-1,this.s17,3,t);}else if(k.KFCM(3,t,['̂',{t:'d',d:2},{t:'a',a:this.s13}])){m=1;k.KDC(3,t);k.KIO(-1,this.s19,3,t);}else if(k.KFCM(3,t,['̀',{t:'d',d:0},{t:'a',a:this.s14}])){m=1;k.KDC(3,t);k.KIO(-1,this.s16,3,t);}else if(k.KFCM(3,t,['́',{t:'d',d:1},{t:'a',a:this.s14}])){m=1;k.KDC(3,t);k.KIO(-1,this.s18,3,t);}else if(k.KFCM(3,t,['̂',{t:'d',d:2},{t:'a',a:this.s14}])){m=1;k.KDC(3,t);k.KIO(-1,this.s20,3,t);}return r;};}