
KeymanWeb.KR(new Keyboard_test_deadkeys());

function Keyboard_test_deadkeys()
{
  
  this.KI="Keyboard_test_deadkeys";
  this.KN="Keyman Deadkey Stress-Tester";
  this.KMINVER="9.0";
  this.KV={F:' 1em "Arial"',K102:0};
  this.KDU=0;
  this.KLS={

  };
  this.KV.BK=(function(x){
    var
      empty=Array.apply(null, Array(65)).map(String.prototype.valueOf,""),
      result=[], v, i,
      modifiers=['default','shift','ctrl','shift-ctrl','alt','shift-alt','ctrl-alt','shift-ctrl-alt'];
    for(i=modifiers.length-1;i>=0;i--) {
      v = x[modifiers[i]];
      if(v || result.length > 0) {
        result=(v ? v : empty).slice().concat(result);
      }
    }
    return result;
  })(this.KLS);
  this.KH='';
  this.KM=0;
  this.KBVER="1.0";
  this.KMBM=0x0010;
  this.s_deadnums="..........";
  this.s_livenums="01234556789";
  this.s_liveQwerty="qwerty";
  this.s_deadQwerty="......";
  this.KVER="10.0.1014.0";
  this.gs=function(t,e) {
    return this.g_main(t,e);
  };
  this.g_main=function(t,e) {
    var k=KeymanWeb,r=0,m=0;
    if(k.KKM(e, 0x4000, 0xBE)&&k.KFCM(7,t,['(','o',')',{d:18},'(','o',')'])) {   // Line 47
      r=m=1;
      k.KO(6,t,"dk(o)");
    }
    else if(k.KKM(e, 0x4000, 0xBE)&&k.KFCM(4,t,[{d:18},'(','m',')'])) {   // Line 41
      r=m=1;
      k.KO(3,t,"dk(m)");
    }
    else if(k.KKM(e, 0x4000, 0xBE)&&k.KFCM(4,t,['(','n',')',{d:18}])) {   // Line 44
      r=m=1;
      k.KO(3,t,"dk(n)");
    }
    else if(k.KKM(e, 0x4000, 0xBE)&&k.KFCM(2,t,[{d:16},{d:17}])) {   // Line 36
      r=m=1;
      k.KO(0,t,"(a)-(s)");
    }
    else if(k.KKM(e, 0x4000, 0xBE)&&k.KFCM(2,t,[{d:17},{d:16}])) {   // Line 37
      r=m=1;
      k.KO(0,t,"(s)+(a)");
    }
    else if(k.KKM(e, 0x4000, 0x30)) {   // Line 60
      r=m=1;
      k.KDO(0,t,0);
    }
    else if(k.KKM(e, 0x4000, 0x31)) {   // Line 61
      r=m=1;
      k.KDO(0,t,1);
    }
    else if(k.KKM(e, 0x4000, 0x32)) {   // Line 62
      r=m=1;
      k.KDO(0,t,2);
    }
    else if(k.KKM(e, 0x4000, 0x33)) {   // Line 63
      r=m=1;
      k.KDO(0,t,3);
    }
    else if(k.KKM(e, 0x4000, 0x34)) {   // Line 64
      r=m=1;
      k.KDO(0,t,4);
    }
    else if(k.KKM(e, 0x4000, 0x35)) {   // Line 65
      r=m=1;
      k.KDO(0,t,5);
    }
    else if(k.KKM(e, 0x4000, 0x36)) {   // Line 66
      r=m=1;
      k.KDO(0,t,6);
    }
    else if(k.KKM(e, 0x4000, 0x37)) {   // Line 67
      r=m=1;
      k.KDO(0,t,7);
    }
    else if(k.KKM(e, 0x4000, 0x38)) {   // Line 68
      r=m=1;
      k.KDO(0,t,8);
    }
    else if(k.KKM(e, 0x4000, 0x39)) {   // Line 69
      r=m=1;
      k.KDO(0,t,9);
    }
    else if(k.KKM(e, 0x4010, 0xBF)) {   // Line 121
      r=m=1;
      k.KO(0,t,"ab    > (a)(b)          tests basic deadkey\rb     > (b)             only matches if \"a\" not pressed first\rbb    > (b)+(b)         Missing deadkey does not trigger match.\rbab   > (b)+(a)+(b)     deadkey at end of context\rac    > x               tests basic deadkey\rade   > (a)(d)(e)       deadkey at start of context\rfade  > (f)-(a)-(d)-(e) deadkey in middle of context\ras.   > (a)-(s)         defined deadkey order (1/2)\rsa.   > (s)+(a)         defined deadkey order (2/2)\rm.    > dk(m)           deadkey output then letters\rn.    > dk(n)           letters output then deadkey\ro.    > dk(o)           letters, deadkey, letters\rpqr   > (p)(q)(r)       deadkey, unmatched, letters\rPQR   > (P)(Q)(R)       deadkey, deadkey, match, match\r12bb  > success         deadkey reordering (with the following)\r21bb  > success         \r21b   > dead2           \r34bb  > success         \r43bb  > success         \rABCDE > success         deadkey output before match(group) rule\r1.    > #1              deadkey matched by any\rq!    > ?               same as above, with extra deadkey output.\rq!.   > (qq)            deadkey matched by context() in context\r\r");
    }
    else if(k.KKM(e, 0x4010, 0x41)) {   // Line 89
      r=m=1;
      k.KDO(0,t,16);
    }
    else if(k.KKM(e, 0x4010, 0x42)&&k.KFCM(1, t, [{d:16}])) {   // Line 90
      r=m=1;
      k.KO(0,t,"ab");
      k.KDO(-1,t,21);
    }
    else if(k.KKM(e, 0x4010, 0x43)&&k.KFCM(1, t, [{d:22}])) {   // Line 91
      r=m=1;
      k.KO(0,t,"abc");
    }
    else if(k.KKM(e, 0x4010, 0x44)&&k.KFCM(3,t,['a','b','c'])) {   // Line 92
      r=m=1;
      k.KO(3,t,"$abc$d");
    }
    else if(k.KKM(e, 0x4010, 0x45)&&k.KFCM(4,t,['a','b',{d:23},'d'])) {   // Line 93
      r=m=1;
      k.KO(3,t,"success");
    }
    else if(k.KKM(e, 0x4010, 0x50)) {   // Line 54
      r=m=1;
      k.KDO(0,t,20);
      k.KDO(-1,t,20);
      k.KO(-1,t,"(P)");
    }
    else if(k.KKM(e, 0x4010, 0x51)&&k.KDM(3,t,20)&&k.KCM(3,t,"(P)",3)) {   // Line 55
      r=m=1;
      k.KO(3,t,"(P)(Q)");
    }
    else if(k.KKM(e, 0x4010, 0x52)&&k.KDM(6,t,20)&&k.KDM(6,t,20)&&k.KCM(6,t,"(P)(Q)",6)) {   // Line 57
      r=m=1;
      k.KO(6,t,"ERROR");
    }
    else if(k.KKM(e, 0x4010, 0x52)&&k.KDM(6,t,20)&&k.KCM(6,t,"(P)(Q)",6)) {   // Line 56
      r=m=1;
      k.KO(6,t,"(P)(Q)(R)");
    }
    else if(k.KKM(e, 0x4000, 0x41)) {   // Line 18
      r=m=1;
      k.KDO(0,t,16);
    }
    else if(k.KKM(e, 0x4000, 0x42)&&k.KDM(5,t,2)&&k.KCM(5,t,"dead1",5)) {   // Line 80
      r=m=1;
      k.KO(5,t,"ERROR");
    }
    else if(k.KKM(e, 0x4000, 0x42)&&k.KDM(5,t,1)&&k.KCM(5,t,"dead2",5)) {   // Line 81
      r=m=1;
      k.KO(5,t,"success");
    }
    else if(k.KKM(e, 0x4000, 0x42)&&k.KDM(5,t,4)&&k.KCM(5,t,"dead3",5)) {   // Line 85
      r=m=1;
      k.KO(5,t,"success");
    }
    else if(k.KKM(e, 0x4000, 0x42)&&k.KDM(5,t,3)&&k.KCM(5,t,"dead4",5)) {   // Line 86
      r=m=1;
      k.KO(5,t,"ERROR");
    }
    else if(k.KKM(e, 0x4000, 0x42)&&k.KCM(3,t,"(b)",3)&&k.KDM(0,t,16)) {   // Line 24
      r=m=1;
      k.KO(3,t,"(b)+(a)+(b)");
    }
    else if(k.KKM(e, 0x4000, 0x42)&&k.KCM(3,t,"(b)",3)) {   // Line 23
      r=m=1;
      k.KO(3,t,"(b)+(b)");
    }
    else if(k.KKM(e, 0x4000, 0x42)&&k.KFCM(1, t, [{d:16}])) {   // Line 19
      r=m=1;
      k.KO(0,t,"(a)(b)");
    }
    else if(k.KKM(e, 0x4000, 0x42)&&k.KFCM(1, t, [{d:2}])) {   // Line 78
      r=m=1;
      k.KO(0,t,"dead2");
    }
    else if(k.KKM(e, 0x4000, 0x42)&&k.KFCM(1, t, [{d:1}])) {   // Line 79
      r=m=1;
      k.KO(0,t,"dead1");
    }
    else if(k.KKM(e, 0x4000, 0x42)&&k.KFCM(1, t, [{d:4}])) {   // Line 83
      r=m=1;
      k.KO(0,t,"dead4");
    }
    else if(k.KKM(e, 0x4000, 0x42)&&k.KFCM(1, t, [{d:3}])) {   // Line 84
      r=m=1;
      k.KO(0,t,"dead3");
    }
    else if(k.KKM(e, 0x4000, 0x42)) {   // Line 20
      r=m=1;
      k.KO(0,t,"(b)");
    }
    else if(k.KKM(e, 0x4000, 0x43)&&k.KFCM(1, t, [{d:16}])) {   // Line 27
      r=m=1;
      k.KO(0,t,"x");
    }
    else if(k.KKM(e, 0x4000, 0x45)&&k.KCM(2,t,"f",1)&&k.KDM(1,t,16)&&k.KCM(1,t,"d",1)) {   // Line 31
      r=m=1;
      k.KO(2,t,"(f)-(a)-(d)-(e)");
    }
    else if(k.KKM(e, 0x4000, 0x45)&&k.KDM(1,t,16)&&k.KCM(1,t,"d",1)) {   // Line 30
      r=m=1;
      k.KO(1,t,"(a)(d)(e)");
    }
    else if(k.KKM(e, 0x4000, 0x4D)) {   // Line 40
      r=m=1;
      k.KDO(0,t,18);
      k.KO(-1,t,"(m)");
    }
    else if(k.KKM(e, 0x4000, 0x4E)) {   // Line 43
      r=m=1;
      k.KO(0,t,"(n)");
      k.KDO(-1,t,18);
    }
    else if(k.KKM(e, 0x4000, 0x4F)) {   // Line 46
      r=m=1;
      k.KO(0,t,"(o)");
      k.KDO(-1,t,18);
      k.KO(-1,t,"(o)");
    }
    else if(k.KKM(e, 0x4000, 0x50)) {   // Line 50
      r=m=1;
      k.KDO(0,t,19);
      k.KDO(-1,t,10);
      k.KO(-1,t,"(p)");
    }
    else if(k.KKM(e, 0x4000, 0x51)&&k.KDM(3,t,10)&&k.KCM(3,t,"(p)",3)) {   // Line 51
      r=m=1;
      k.KO(3,t,"(p)(q)");
    }
    else if(k.KKM(e, 0x4000, 0x52)&&k.KDM(6,t,19)&&k.KCM(6,t,"(p)(q)",6)) {   // Line 52
      r=m=1;
      k.KO(6,t,"(p)(q)(r)");
    }
    else if(k.KKM(e, 0x4000, 0x53)) {   // Line 34
      r=m=1;
      k.KDO(0,t,17);
    }
    if(m) {
    
      r=this.g_dead_reorder(t,e);
    }
    return r;
  };
  this.g_dead_reorder=function(t,e) {
    var k=KeymanWeb,r=1,m=0;
    if(k.KCM(6,t,"$abc$d",6)) {   // Line 130
      m=1;
      k.KO(6,t,"ab");
      k.KDO(-1,t,23);
      k.KO(-1,t,"d");
    }
    else if(k.KCM(2,t,"ab",2)&&k.KDM(0,t,21)) {   // Line 129
      m=1;
      k.KDO(2,t,22);
    }
    else if(k.KDM(0,t,2)&&k.KDM(0,t,1)) {   // Line 126
      m=1;
      k.KDO(0,t,1);
      k.KDO(-1,t,2);
    }
    else if(k.KDM(0,t,3)&&k.KDM(0,t,4)) {   // Line 127
      m=1;
      k.KDO(0,t,4);
      k.KDO(-1,t,3);
    }
    return r;
  };
}
