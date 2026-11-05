/* Reviewed against the linked CSI PDF on 2026-11-05. PDF page is printed page + 1.
   Short editorial summaries, not official quotations. Keep decision facts explicit. */
window.RULES_DESK = {
 pdf:'https://www.playcsipool.com/uploads/7/3/5/9/7359673/official_rules_of_csi__08122025.pdf',
 topics:[
  {id:'scratch8',games:['8'],title:'Scratch while shooting the 8',keywords:['scratch','scratched','cue ball','lose','loss','eight'],start:'phase',nodes:{
   phase:{q:'Was this on the break or a later shot?',choices:[['On the break','breakRedirect'],['After the break','potted'],['Not sure','unclear']]},
   breakRedirect:{q:'Use the break-specific topic instead.',choices:[['Start 8-ball break lookup','@break8']]},
   potted:{q:'Did the 8-ball go into a pocket on that shot?',choices:[['Yes','loss'],['No','still'],['Not sure','unclear']]},
   still:{q:'Did the 8 stay on the table, with no separate loss-of-game violation?',choices:[['Yes — scratch only','bih'],['No / not sure','unclear']]},
   loss:{answer:'Scratching and pocketing the 8 after the break loses the game.',rule:'2-10(a)',page:46},
   bih:{answer:'A scratch alone does not lose here. Opponent gets ball in hand.',rule:'2-9(2)',page:45}
  }},
  {id:'break8',games:['8'],title:'8-ball break: scratch or pocketed 8',keywords:['break','broke','scratch','8','eight'],start:'legal',nodes:{
   legal:{q:'Did the break meet the requirements in Rule 2-3 (apart from any scratch)? If unsure, open the rule before choosing.',rule:'2-3',page:43,choices:[['Yes','potted'],['No','illegal'],['Not sure','unclear']]},
   illegal:{answer:'Opponent chooses who re-breaks after a re-rack. Play cannot continue from this layout.',rule:'2-3(3)',page:44},
   potted:{q:'Was the 8 pocketed on the break, noticed before another shot?',choices:[['Yes','foul'],['8 was not pocketed','scratch'],['Not sure / noticed later','unclear']]},
   foul:{q:'Did the breaker commit a foul?',choices:[['Yes','eightFoul'],['No','eightClean'],['Not sure','unclear']]},
   scratch:{q:'Did the breaker scratch or commit another foul?',choices:[['Yes','breakFoul'],['No','open'],['Not sure','unclear']]},
   eightFoul:{answer:'Opponent chooses: spot the 8 with ball in hand anywhere, or re-rack and break.',rule:'2-4(2)',page:44},
   eightClean:{answer:'Breaker chooses: spot the 8 and play from position, or re-rack and break again.',rule:'2-4(1)',page:44},
   breakFoul:{answer:'Opponent gets ball in hand anywhere.',rule:'2-3(4)',page:44},
   open:{answer:'The table is open after the break.',rule:'2-5',page:44}
  }},
  {id:'groups',games:['8'],title:'Solids or stripes after the break',keywords:['solid','solids','stripe','stripes','group','groups','open','break'],start:'answer',nodes:{answer:{answer:'Break balls do not assign groups. The first legally pocketed post-break ball assigns them; a safety cannot.',rule:'2-5, 2-6',page:44}}},
  {id:'ninebreak',games:['9'],title:'9-ball pocketed on the break',keywords:['9','nine','break','win'],start:'foul',nodes:{foul:{q:'Was the 9 legally pocketed on the break, with no foul?',rule:'3-3',page:47,choices:[['Yes','win'],['No — there was a foul','spot'],['Not sure','unclear']]},win:{answer:'A legally pocketed 9 on the break wins.',rule:'3-3(3)',page:47},spot:{answer:'The 9 is spotted when pocketed on a foul break.',rule:'3-3(3)',page:47}}},
  {id:'tenbreak',games:['10'],title:'10-ball pocketed on the break',keywords:['10','ten','break','win'],start:'legal',nodes:{legal:{q:'Was the 10 legally pocketed on the break, without a foul?',choices:[['Yes','spot'],['No / not sure','unclear']]},spot:{answer:'Spot the 10 and continue shooting; this is not a break win.',rule:'4-3(3)',page:51}}},
  {id:'push',games:['9','10'],title:'When is a push-out available?',keywords:['push','pushout','push-out','roll','rollout'],start:'answer',nodes:{answer:{answer:'Only on the first shot after a foul-free break. Announce it and get acknowledgment. Other fouls still apply.',rule:'3-4 / 4-4',page:48,page10:51}}}
 ],
 library:[
  ['8-ball rules',43],['9-ball rules',47],['10-ball rules',50],['Calling shots',29],['Legal contact / rails',31],['Frozen cue ball',32],['Scratch / double hit',34],['Accidentally moved balls',34],['Ball in hand',36],['Applied rulings / examples',75]
 ]
};
