(function(t,u,c,d){"use strict";const{DCDChatManager:g}=c.ReactNative.NativeModules,o=d.findByStoreName("UserStore"),f=u.before("updateRows",g,function(i){const m=JSON.parse(i[1]);for(const n of m){if(n.type!==1||!n?.message?.username||!n?.message?.authorId)continue;const s=n.message,e=o.getUser(s.authorId);if(e&&!(e.bot&&e.discriminator=="0000")&&(e.discriminator=="0"?s.username+=" (@"+e.username+")":s.username!=e.username?s.username+=" ("+e.tag+")":s.username+="#"+e.discriminator,s.referencedMessage?.message?.username)){const a=n.message.referencedMessage.message,r=o.getUser(a.authorId),v=a.username.replace("@","");if(!r||r.bot&&r.discriminator=="0000")return;r.discriminator=="0"?a.username+=" (@"+r.username+")":v!=r.username?a.username+=" ("+r.tag+")":a.username+="#"+r.discriminator}}i[1]=JSON.stringify(m)}),h=function(){f()};return t.onUnload=h,t})({},vendetta.patcher,vendetta.metro.common,vendetta.metro);
