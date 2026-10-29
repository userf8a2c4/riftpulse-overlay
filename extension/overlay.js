/* RiftPulse — lector del HUD de la transmisión (reloj, marcador y siglas) sin librerías externas.
   Compara cada carácter con plantillas de tipografías condensadas (como las de los HUD de esports)
   y con los glifos reales del HUD del Mundial. Las siglas se buscan solo entre los equipos del torneo. */
(function () {
  'use strict';
  var T = {"h":18,"f":[{"0":[10,"Aq7/6iAd////0H/////3z/9m//zf/xH//u//EP/+7/8Q//7v/xD//u//EP/+7/8Q//7v/xD//u//EP/+7/8Q//7v/xD//s//Zv/8j/////cd////0AKu/+og"],"1":[6,"AB7/A9//rv//3///2c//AL//AL//AL//AL//AL//AL//AL//AL//AL//AL//AL//AL//AL//"],"2":[10,"AY3uxwAM////sG/////2r/+I//zP/xD//t//AP/+3/8D//wiIgj/9wAALv/hAAC//4AACP/8AABv/9EAAu/+MAAM//YAAG//1VVUr/////zP/////N/////8"],"3":[10,"AY3uyBAd////sH/////1v/+I//rP/xD//FZmAv/7AABc//gAAP//0QAA//+QAADP//YAAAf/+ru6Af/87/0B//zv/QH//M//R//5n/////Qu////sATP/+kQ"],"4":[10,"AAr//+AADv//4ABP///gAJ/9/+AA3+v/4AP/qv/gBv96/+AL/0r/4A7+Cv/gT/wK/+B/+Qr/4M/1Cv/g7/////3v/////e/////9AAAK/+AAAAr/4AAACv/g"],"5":[10,"f/////V/////9X/////1f/9VVVF//xEQAH//v/wgf////9F//+7/93//FP/6JVUC//wAAAL//Ku7Av/93/8C//zf/wL/+8//Z//5n/////U+////wAO+/+oQ"],"6":[10,"Aq7/6iAd////0W/////3r/8y//nP/wDv+d//ADMy7/8BIADv/6/+cO/////17/////rv/zX//e//Av/+7/8C//7f/wL//c//V//6j/////Uu////wAO+/+oQ"],"7":[9,"7/////7/////7////+RVVv/8AABv/4AADP/zAAP//AAAn/9gAA7/4AAF//kAAL//MAAf/9AABf/5AACf/2AADP/zAADv/wAAH//gAAP//AAA"],"8":[10,"A77/6zA+////4Z/////4z/9m//zf/wDv/c//If/8n//M//gc////sT7////Tr/+8//rP/xHv/d//AO/93/8A7/3P/wDv/a//iP/6b/////UN////wAKu/+og"],"9":[10,"Aq7/6yAN////0G/////3v/9l//vf/yD//e//EP/+7/8g//7f/0P//q/////+b/////4I7+n//gACEP/+IzMA//2v/gD//K//I//5j/////Uu////wAO+/+oQ"],"A":[10,"Af///yAD////QAT///9gBv/d/3AI/8z/kAr/u/+wC/+p/8AN/5j/4A7/d//wH/9m//Iv/1T/80//Q//0X//M//Zv////94/////4n/4Az/q//QC/+8/8AJ/9"],"B":[9,"3//+xQ3////i3/7f/33/kO/53/kN/63/kO/53/pO/23///6g3///+x3/yv/33/kM/63/kK/83/kK/83/kK/83/pN/63////23////h3//+sw"],"C":[9,"A8/+xAHv///jf////5v/09/8z/oK/93/oK/93/oK/93/oBIi3/oAAA3/oAAA3/oHqq3/oK/+3/oK/+3/oK/+z/09/9j////6Hv///jA77/xQ"],"D":[9,"3//+tQ3////j3////53/s9/83/oL/93/oL/93/oL/93/oL/93/oL/93/oL/93/oL/93/oL/93/oL/93/oL/83/s9/73////33////h3//+sw"],"E":[8,"3///+N////jf///43/53dN/9AADf/QAA3/0AAN////bf///23///9t/+VVLf/QAA3/0AAN/9AADf/nd23////N////zf///8"],"F":[7,"3///7f///t///+3/t3ff+AAN/4AA3/yqff//+9///73/3Mnf+AAN/4AA3/gADf+AAN/4AA3/gADf+AAN/4AA"],"G":[9,"BM//xAHv///ij////4v/07/73/oI/93/oI/+3/oBIi3/o3d33/pv/+3/pv/+3/pM/+3/oH/+3/oH/+z/oH/+v/07/+f////+Hv//3uBd/8Ke"],"H":[9,"3/oK/93/oK/93/oK/93/oK/93/oK/93/oK/93/2t/93////93////93/7O/93/oK/93/oK/93/oK/93/oK/93/oK/93/oK/93/oK/93/oK/9"],"I":[4,"3/3f/d/93/3f/d/93/3f/d/93/3f/d/93/3f/d/93/3f/d/9"],"J":[9,"AAAK/+AAAK/+AAAK/+AAAK/+AAAK/+AAAK/+AAAK/+AAAK/+AAAK/+d3QK/+7/kK/+7/kK/+7/kK/+7/kK/+3/s8/8r////4Pv///hBL/+sg"],"K":[9,"3/cO/23/c//z3/dv/g3/ev+w3/ff9w3/n/9A3/z/4Q3/7/wA3///oA3/7/0A3/v/8g3/jv9Q3/fP+Q3/ef/A3/df/x3/cv/13/cO/43/cK/8"],"L":[8,"3/0AAN/9AADf/QAA3/0AAN/9AADf/QAA3/0AAN/9AADf/QAA3/0AAN/9AADf/QAA3/0AAN/9AADf/SIi3////d////3f///9"],"M":[14,"3//4AH///t//+gCf//7f//wAv//+3//+AN///t///xD///7f/v8y/+/+3/v/ZP/P/t/5/4b/n/7f9v+4/3/+3/Xf2v5f/t/1v+z9T/7f9Z//+k/+3/Vv//hP/t/1T//2T/7f9R//80/+3/UO//FP/t/1C//gT/7f9Qn/sE/+"],"N":[9,"3/0J/93/8Z/93/85/93/9p/93/+Z/93/+5/93//p/93//7/93//+/93/3//93/v//93/nf/93/mv/93/mP/93/lf/93/kv/93/kO/93/kL/9"],"O":[9,"BM//xALv///ij////5z/08/83/oJ/+3/oJ/+3/oJ/+3/oJ/+3/oJ/+3/oJ/+3/oJ/+3/oJ/+3/oJ/+z/oK/9v/09/8f////4Hv///hA77/ww"],"P":[9,"3//+sw3////i3////43/tu/83/kK/93/kJ/+3/kK/93/yO/83////43////i3/7Mkg3/kAAA3/kAAA3/kAAA3/kAAA3/kAAA3/kAAA3/kAAA"],"Q":[9,"Bd/+oQPv//+wn////y3/pP/27/YO/37/YO/37/YO/37/YO/37/YO/37/YO/37/YO/37/YO/37/YO/37/YO/33/pP/2n////yPv//+wBd///o"],"R":[9,"3//+2A3////23////73/xc/93/sI/+3/sI/+3/xc/93////43///+w3/7f/23/sN/63/sL/73/sL/73/sL/73/sL/73/sL/73/sL/73/sL/7"],"S":[9,"BM//swPv///in////4z/o9/73/kL/9z/5BERj//kAAHf/+UAAc//5QAB3//iAAHP/5q7ce/93/kJ//3/kI/+z/w7/9j////5Lv///zBM//1Q"],"T":[8,"7////e////3v///9d+/8dgDf+gAA3/oAAN/6AADf+gAA3/oAAN/6AADf+gAA3/oAAN/6AADf+gAA3/oAAN/6AADf+gAA3/oA"],"U":[9,"7/gI/97/gI/97/gI/97/gI/97/gI/97/gI/97/gI/97/gI/97/gI/97/gI/97/gI/97/gI/97/gI/97/gJ/9z/w8/8n////4Lv///iBM//xA"],"V":[9,"3/UF/9v/cG/8n/gH/6j/oJ/4b/sK/2T/0L/1L/4N/zD/8e/xDv9P/gDP9v/ACv+f+wCP/P+QB//v9wBf//9gA///9AAf//8gAO//8AAN//0A"],"W":[15,"z/wD//UL/9v/0E//YM/8n/4G//cO/6j/8X//kP/5b/8p//of/3X/86//w//2P/9M//1P/0L/9t//5f/yDv9+//+P/xDf+v/v+v/gC//P+//P/ACv/v9//v+gCP//9P//+QBv//8e//9wBP//4N//9QAv//0L//8wAP//sK//8QAO//oI//4A"],"X":[10,"b/8z//ZP/1X/9B//dv/yDf+Y/+AK/8r/sAf/7P+ABP/+/1AB////EADv//4AAf///xAE////UAj/7f+AC//L/8AO/5j/4D//dv/zb/9E//af/yH/+c/+AO/8"],"Y":[9,"v/gH/9j/sJ/5X/0L/2H/4O/zDf9f/gCf+v+wBv/v9wA///9AAO//4QAL//wAAI//kAAE//UAAC//MAAC//MAAC//MAAC//MAAC//MAAC//MA"],"Z":[8,"n////Z////2f///9NVXv+wAF//UACv/hAA7/oABv/zAAz/wAA//3AAj/8gAN/7AAP/9gAI/+EADf/VVT////+v////r////6"]},{"0":[10,"Aa7/6hAM////wH/////3z/907/zv/wDP/v//AM////8Az////wDP////AM////8Az////wDP////AM////8Az//v/wDP/t//Uu/8j/////gd////0QLP//wg"],"1":[6,"AF7/O///3///3t//cX//AH//AH//AH//AH//AH//AH//AH//AH//AH//AH//AH//AH//AH//"],"2":[10,"AZ7/6hAL////wG/////3v/0Rz/vv+QCv/O/4AM/7MzIC//cAAAv/4QAAf/9wAALv/QAAC//jAABv/4AAAu/9EAAK/+MAAG//cAAA7/////b/////9v/////2"],"3":[10,"Aa7/6hAc////0Y//3f/4z/4Q3/3v/ACv/szKAK/9AAAA3/oAAnv/4gAE//5QAAT//9EAACb/+QAAAM/93doAr/7v/ACv/s/+EN/8j//t//cd////0QPf//0w"],"4":[11,"AABf//UAAAz//1AABP//9QAAv+//UAAv+//1AAn+b/9QAe+V//UAb/Nf/1AM/AX/9QP/cF//UJ/hBf/1Dv7M3//c//////////////8AAAX/9QAAAF//UAAABf/1AAAAX/9Q"],"5":[10,"j/////KP////8p/////yn/ciIiCv9QAAAK/1ABAAv/nO/CC/////0c//zf/3z/oB7/tWYgC//QAAAK/+MzIAn/7v+gCf/d/8AL/7n/+H7/c+////0QTv//wg"],"6":[10,"Aa7//DAM////4m//y//5v/4A3/zf/ACKqe/8AAAA//wCIAD//c/+YP/////j//+7//n//ADv/f/8AM/+7/wAz/7f/ADP/a/+AO/6X//L//UL////wACe/+oQ"],"7":[8,"///////////MzN/+AACP+wAAz/gAAe/0AAT/8QAH/8AAC/+AAA7/QAA//gAAj/sAAM/4AAH/9AAE//EACP/AAAv/kAAN3VAA"],"8":[10,"Aa7/6hAM////wG//zP/2v/4A7/vP/ADP/M/8AM/8j/4R7/gd/8z/4QX///9QDP///8CP/nfv98/8AM/87/oAr/7v+gCv/s/8AM/8j/+Z//cd////0QPf//0w"],"9":[10,"As///CAN////0W//qf/3v/8g3/zf/wDP/u//AM/+7/8Az//P/yDP/4//y///Lv////8F3/zf/wACIM//AAAAz/5qqgDP/Z//EO/7b//L//YN////wAK+/+oQ"],"A":[11,"AAv//AAAAO//4AAAH///IAAE///0AABv/v9wAAn/z/kAAL/4/8AADv9P/gAC//Hv8gBf/gz/UAj/wK/4AL/7Of+wDv////4C//////JP/0I+/0f/4ADf96/8AAv/rP+gAJ/8"],"B":[11,"///+yTAP/////2D//5vv/h//8Af/9f//AC//b//wA//1//8Aj/4f//zf/lD////+kg///N//0f//AG//n//wAf/9//8AD//v//AB//7//wGP/7//////9P/////oDMzMu4MA"],"C":[10,"AJ7/6yAc////4n//uv/5v/4Av/3v/ACv/u/8AK////wAV3f//AAAAP/8AAAA//wAAAD//AAAAP/8AGmZ7/wAr//v/ACv/r/+AL/8f/+6//kc////4gCe/+sg"],"D":[10,"///utgD/////wf/+zv/3//oB7/z/+gDP/v/6AM/+//oAz///+gDP///6AM////oAz///+gDP///6AM////oAz/7/+gDP/v/6Au/7//7O//f/////wf//7rYA"],"E":[8,"/////f////3//szK//wAAP/8AAD//AAA//wAAP/+zLD////Q////0P/8AAD//AAA//wAAP/8AAD//AAA//7MzP//////////"],"F":[8,"/////////////8zM//8AAP//AAD//wAA//8AAP//qqX////3////9///IiH//wAA//8AAP//AAD//wAA//8AAP//AAD//wAA"],"G":[11,"AI3//qEAr////8Ff/+nf/3r/9QL//N//MA//7v/zAP////8wAREf//MAAAD//zJmZm//81//////Nf/////zAJ//7/8wCf/9//MAr/+v/2AN//X//pz//wv///7f8Bnv/Tnd"],"H":[11,"//8AD/////AA/////wAP////8AD/////AA/////wAP////8AD/////qq////////////////////Ii/////wAP////8AD/////AA/////wAP////8AD/////AA/////wAP//"],"I":[4,"////////////////////////////////////////////////"],"J":[6,"AM//AM//AM//AM//AM//AM//AM//AM//AM//AM//AM//AM//AM//AM//AN/+Wv/83//33/+w"],"K":[11,"//8AT/+f//AJ//P//wHv/A//8H//YP//Df/hD//0//kA//+v/yAP//7/oAD////5AA/////gAP//n/9QD//z//sA//8N/+EP//B//2D//wL/+w//8Az/4f//AI//f//wA//8"],"L":[8,"//wAAP/8AAD//AAA//wAAP/8AAD//AAA//wAAP/8AAD//AAA//wAAP/8AAD//AAA//wAAP/8AAD//AAA//7MzP//////////"],"M":[13,"r/+QAI//mv/8AAv/+b//4ADv/5v//yAv//m///UF//+s//9wj//6z/36C/3/rP+v0N+v+8/3/i/4/73/X/j/X/vf8v/v8v+9/w7//R/83+C//6H/zv4I//cP/O/gX/9A/879Av/xDv3/0A7+AO/f/QC/sA79"],"N":[10,"/+AAb///9gBv///9AG////9Qb////8Bv////8m/////5b/////5////+/9////n/////9s/////2X/////YO////9gr////2A/////YAz///9gBf///2AA3/"],"O":[11,"AI7//oAAv////7Bv/9nf/2v/9AT/+9//IC//3v/yAv/+//8gL/////IC/////yAv////8gL/////IC/////yAv//7/8gL//t//IC//2//0BP/7X//Z3/9Qv////7AAjv/+gA"],"P":[11,"////7IAP/////8D//8zv/3//8ALv/P//AAz/7//wAM/+//8ADv/f//d7//n//////i/////9QP//VEIAD//wAAAA//8AAAAP//AAAAD//wAAAA//8AAAAP//AAAADd3QAAAA"],"Q":[11,"AI7//oAAv////7Bv/9nf/2v/9AT/+9//IC//3v/yAv/+//8gL/////IC/////yAv////8gL/////IC/////yAv//7/8gL//t//IC//2//0BP/7X//Z3/9gv////7AAjv//0A"],"R":[11,"///+2kAP/////5D//Znf/0//wAL/+P/8AA3/n//AAN/5//wAL/+P/9eN//P/////+A/////6AP/8Dv/QD//An/8g//wF//cP/8Ae/7D//ADP/h//wAn/9P/8AF//jd2gAd3a"],"S":[10,"A8///CAu////sK//y//z3/8Q7/fv/wDP59//cCEAj//jAAAd//5gAAPv//gAAD3//2AAAs//4gAADf/5esUE//3v9wD//r/8Af/9f//d//gM////wQGe/+oQ"],"T":[9,"//////////////////AH//UAAH//UAAH//UAAH//UAAH//UAAH//UAAH//UAAH//UAAH//UAAH//UAAH//UAAH//UAAH//UAAH//UAAG3dQA"],"U":[10,"//oAr///+gCv///6AK////oAr///+gCv///6AK////oAr///+gCv///6AK////oAr///+gCv///6AK//7/oAr/7v+gCv/s/9AN/8j//d//gt////0gKu/+oQ"],"V":[11,"v/oADP/I/8AA7/lf/gAv/2L/8gT/8w7/QG/+AM/2CP/ACv+Ar/oAf/sM/3AF/9Dv9QAv/h//MADv9v/gAAz/v/wAAJ/+/5AABv//9gAAP///MAAA7//gAAAM//wAAACf/5AA"],"W":[14,"3/UF/zBf/M/2B/9Qf/uv+An/gJ/5j/oL/6Cv93/7Df/Az/Zf/Q//4O/0P/4v//L/8y//X971//EO/4+8+P/gDf+/q/v/wAv/74n+/6AJ//9n//+AB///Rf//cAX//zP//1AD//8R//8wAf/+AO//EADv/ADP/gAA3/kAn/wA"],"X":[11,"n/4AC/9j//YB7+EM/9Bv+wBv/0v/cAHv+//yAAr///wAAD///2AAAM//4QAACf/7AAAA3/+QAABP//0AAAr///UAAe/+/8AAb/1//zAK/3Lv+AHv4Qr/0G/7AE//XP9gAM/8"],"Y":[11,"v/8QDP/V//YB7/cO/7Bv/yC//hr/wAb/9u/4AC//3/9AAM///+AAB///+QAAL///QAAAz//gAAAH//oAAABv/5AAAAb/+QAAAG//kAAABv/5AAAAb/+QAAAG//kAAABv/5AA"],"Z":[8,"z////8////+szO/9AAHv+QAG//QACv/gAA7/kABf/zAAn/0AAO/5AAT/9AAK/+AAHv+AAF//MACv/AAA7/3MzP//////////"]},{"0":[9,"Bd//1QPv///jr/pq/67/EB/+//AA////AA////AA////AA////AA////AA////AA////AA////AA////AA//7/EB/+r/pq/6Pv///jBd//1Q"],"1":[6,"AAT9AAz9it/93//9Mz79AA39AA39AA39AA39AA39AA39AA39AA39AA39AA39AA39AA39AA39"],"2":[9,"BM//1QHv///jf/pr/6v/EB/+z/AA/+z/AC/9AAAH/4AAAN/hAACv+AAAn/sAAJ/8AABf/RAADf0QAAb/cAAAr/MAAAz/mIiGz////6z////6"],"3":[9,"Bd//wwLv///hn/ls/33+AE/63+AD/7MzAD/6AAAH/2AAvP/AAA7/4wAAvf/RAAAI/4AAAD/7u5AC/8/8AC/87+AD/7r/ls/4Pv///hBd//xA"],"4":[10,"AAAM/4AAAD//gAAAn/+AAAHv/4AAB///gAAN/P+AAG/n/4AAv6b/gAPvVv+AC/0G/4Av9wb/gI/hBv+Az+zN/9rP/////au7vf/aAAAG/4AAAAb/gAAABv+A"],"5":[9,"T////2X////2b/uIiDf/QAAAj/MAAAj/M1QAn/r//Br////4v/g4/9vdAB/+AAAA/+AAAA/+mqAA/+z/AA/+z/EB/9j/pr/6Hv///jBM//1Q"],"6":[9,"Bd//xAT////ir/tq/43+AA3779AAiY79AAAA79Bocg79r//i7+///47/QF/879AA7979AA7979AA7979AA793+AA78r/pr/5T////jBd//xA"],"7":[9,"7////97////9iIiJ/9AAAE/4AAAI/zAAAM/QAAAv+QAAB/9gAADP8gAAL/wAAAb/cAAAr/IAAA78AAAE/5AAAJ/1AAAO/hAABP+wAACP9gAA"],"8":[9,"BM//xAPv///jn/pq/5v/EB/7z/AA/8z/AA/8n/MD/5Pv6+/iBv//9gTv7O/kr/MD/63+AA7939AA3939AA393+AA79r/pq/6T////0Bc//xQ"],"9":[9,"BM//1QPv///0n/tq/6z+AA793+AA3+3+AA3+3+AA3+3+AA3+z/UE/+n///7+Lv/63+Anhg3+AAAA3+iYAA3+v9AA79j/pr/6Pv///0BM//1Q"],"A":[10,"AA7/8QAAP//zAABf//UAAH/e+AAAn636AADPi/wAAO9p/gAC/0f/IAT/Jf9QCP8D/4AK/QH/sA37AO/QH/////E/////81/3Zp/2j/EAT/iv4AAf+s/AAA78"],"B":[9,"///tog/////h/9ie/3/8AF/5/8AD/6/8AD/5/8AH/2/+vP/R////5A/+zO/k/8AE/7/8AA79/8AA3+/8AA3+/8AA79/9ic/6/////j///uow"],"C":[8,"B+/+cF////W/537776AI/u+QB/7vkAf+75AAEe+QAADvkAAA75AAAO+QAADvkAWq75AH/u+QB/7voAj+v+d++1////UH7/5w"],"D":[9,"///tow/////h//md/4//AD/9//AB/+//AB/+//AB/+//AB/+//AB/+//AB/+//AB/+//AB/+//AB/+//AB/+//AD/9//md/4/////h///tow"],"E":[8,"/////v////7/2IiI/8AAAP/AAAD/wAAA/8AAAP/ru5D////A/+zMoP/AAAD/wAAA/8AAAP/AAAD/wAAA/9iIiP////7////+"],"F":[8,"/////v////7/+YiI//AAAP/wAAD/8AAA//AAAP/3d2D////A////wP/wAAD/8AAA//AAAP/wAAD/8AAA//AAAP/wAAD/8AAA"],"G":[9,"Bd//xAPv///hr/pq/47/EB/7//AA/8//AAu5//AAAA//ATMz//Bv/8//Bv/8//AU/8//AA/8//AA/8//AA/87/EB/7r/pq/3Pv///hBd//ww"],"H":[9,"/8AA79/8AA79/8AA79/8AA79/8AA79/8AA79/8AA79/+u779/////9/+zM79/8AA79/8AA79/8AA79/8AA79/8AA79/8AA79/8AA79/8AA79"],"I":[3,"////////////////////////////////////"],"J":[6,"AD/8AD/8AD/8AD/8AD/8AD/8AD/8AD/8AD/8AD/8AD/8AD/8AD/8AD/8AG/7me/3///h7tow"],"K":[9,"/5AB74/5AH/h/5AN+Q/5B/4g/5DvoA/5b/MA/537AA/9/9AA////IA//7/cA//n/sA/+Hf4A/5B/9Q/5Av+Q/5AN/Q/5AI/y/5AE/2/5AA76"],"L":[8,"//AAAP/wAAD/8AAA//AAAP/wAAD/8AAA//AAAP/wAAD/8AAA//AAAP/wAAD/8AAA//AAAP/wAAD/8AAA//mIiP////7////+"],"M":[12,"//8wBP/9//9QBv/9//9wCP/9//+QCv/9/++wDP79/8/ADuz9/5/gH8v9/37yP6v9/3z0X3v9/3r3f0v9/3f5nyv9/3X8vgv9/3L+3Av9/3Dv+gv9/3DP+Av9/3Cv9gv9/3CP9Av9/3Bv8gv9"],"N":[9,"//kAr8//wAr8//4Qr8//9gr8//+gr8/8/gr8/47zr8/4v3r8/4j6r8/4T+r8/4Hv38/4C//8/4Bv/8/4Av/8/4AN/8/4AJ/8/4AG/8/4AC/8"],"O":[9,"Bd//1QPv///jr/pq/67/EB/+//AA////AA////AA////AA////AA////AA////AA////AA////AA////AA//7/EB/+r/pq/6Pv///jBd//1Q"],"P":[8,"///sUP////T/yK76/5AK/v+QCf//kAn//5AJ/v+QDP3/3N/5////0f/bpxD/kAAA/5AAAP+QAAD/kAAA/5AAAP+QAAD/kAAA"],"Q":[9,"B+/+kAX///+Av+dt/g76AH/y/5AG/z/5AG/z/5AG/z/5AG/z/5AG/z/5AG/z/5AG/z/5AG/z/5AG/z/5AG/z76AH/yv+dt/gX///+QB+/+/q"],"R":[9,"///tkg/////R/9ie/2/8AG/4/8AE/5/8AE/4/8AG/3/9Nd/i////5Q////+w/9Nd/1/8AG/4/8AE/5/8AD/5/8AD/5/8AD/5/8AD/5/8AB/7"],"S":[9,"A8//1QHv///if/xp/5v/QA79v/MA3+n/cAERP/5AAACv/kAAAc/+UAAAv/9QAACv/hAAAL/4RVAD/9z/AB/+v/EB/+j/pq/6Hv///jBM//1Q"],"T":[9,"3////83////8iI7+iHAA79AAAA79AAAA79AAAA79AAAA79AAAA79AAAA79AAAA79AAAA79AAAA79AAAA79AAAA79AAAA79AAAA79AAAA79AA"],"U":[9,"3/EA7+3/EA7+3/EA7+3/EA7+3/EA7+3/EA7+3/EA7+3/EA7+3/EA7+3/EA7+3/EA7+3/EA7+3/EA7+3/EA7+z/IA/9j/tq/5Lv///iBM//1Q"],"V":[9,"z8AAn8r+AAr6j/AAz4b/IA71T/QB/zL/YD/xDvgF/gDPoH/ACvwI+gCP4K+ABv8c9QBP8+8wAv9/8QAO/P4AAN/vwAAK//oAAI//gAAG//YA"],"W":[14,"77AI/6AJ/t/ACv+wC/zP0Az/0Az6r+AN/+AO+J/xD//xD/d/8x/u8i/1b/Q/3fQ/81/2T8v2T/E/91+p91/gL/l/l/l/0A/7j3b7j8AO/J9k/J+gDP6/Qv6/kAr/3zD/33AI//8Q7/9gB//+AM//UAX//QC//zAD//sAn/8g"],"X":[10,"n/UAHvhP+QBv8w39AK/QB/9B73AC/4b+EAC/zPsAAG//9QAAH//hAAAM/7AAAA3/0AAAP//yAACP7/cAAN9+/AAE/yn/MAr9A/+QHvgAz+Fv8wCP9b/QAE/6"],"Y":[10,"z/MAHvx/+ABf9z/8AI/hDP8g37AH/2L/YALvp/8gAL/t+wAAf//2AAAv/+EAAAz/oAAAB/9gAAAH/2AAAAf/YAAAB/9gAAAH/2AAAAf/YAAAB/9gAAAH/2AA"],"Z":[8,"r////q////5oiI7+AABP+AAAr/MAAu/AAAj/YAAN/hAAT/oAAK/0AAHv0AAG/3AADP4AAC/5AACP8wAA3+mIiO////7v///+"]},{"0":[10,"AZ7/6RAM////wF//7v/2v/4R3/vP+gCf/d/6AJ/+3/oAn/7f+gCf/t/6AJ/+3/oAn/7f+gCf/t/6AJ/+3/oAn/7P+gCf/b/+Ed/7X//u//YM////wAGe/+kQ"],"1":[6,"Oe/+7//+7//+mb/+AI/+AI/+AI/+AI/+AI/+AI/+AI/+AI/+AI/+AI/+AI/+AI/+AI/+AH/+"],"2":[10,"Aq7/6AAd////oI//7v/z3/wE//f/+QD/+e7oAf/5AAAF//YAAAv/8gAAT/+wAAHf/iAACf/2AABe/6AABO/8AAAN/+MAAJ//kRER7/////3v/////e/////9"],"3":[10,"j/////yP/////Y/////9AREs//gAAJ//wAAF7/0QAC7/4gAAf//rIAAK3f/iAAAAz/gAAACP+wAAAH/8m7gAj/3P+wCP/K/+EM/7f//u//cM////0QGe/+og"],"4":[12,"AAf/9QAAAAz/4AAAAB7/sAAAAG//YAAAAL//EAAAAe/8AAAAB//3AAAADP/zDv+QL//QD/+Qf/9wD/+gv//////8z//////9z//////9IzMzT/+zAAAAD/+QAAAAD/+QAAAAD/+QAAAADv+Q"],"5":[10,"z/////vP////+8/////7z/sRERHP+gAAAM/6AAAAz/oEQQDP/M/+YM/////0z//d//rP/QDf/BEQAJ/+AAAAn/6+6wCf/q/+Ed/8b//u//kM////4gGe/+og"],"6":[10,"AZ7/6RAd////wH//7v/2v/4S7/rP+wDP+8/7AEZkz/tIgwDP/v//gM/////0z/5U7/rP/ACv/c/7AJ/+z/sAn/+//ACv/p/+Ed/9X//u//kM////4gGe/+sw"],"7":[10,"z/////3f/////d/////93/IS7/xWYAT/+AAACf/0AAAO/+AAAD//kAAAf/9QAADP/gAAAe/6AAAE//YAAAn/8gAADf/QAAAv/5AAAG//QAAAr/4QAADv+gAA"],"8":[10,"AZ7/6AAM////wG//7v/2v/0S7/rf+gC//M/6AL/7n/0B7/g//93/4gXv//5AHf///8F//iTv9r/7AM/63/oAr/zP+gC//K/9Ee/5X//u//QL////oACO/+cA"],"9":[10,"Ar7/6RAu////0J//7v/23/0R7/rv+gC//O/6AL/87/oAv/zP+wDP/J/+eP/8Pv////wE7/7f/AAVUb/9WIYAv/2v/QC//Z/+Ie/8X//u//gM////0QCe/+oQ"],"A":[12,"AALv/iAAAAX//1AAAAj//4AAAAv//7AAAA7//+AAAC/87/IAAG/5v/UAAJ/3n/gAAL/0f/sAAO/yT/4AA//gL/8wB//ADv9wC//szv+wDv/////gP//////yb/4AAv/2n/0AAO/4z/oAAM/7"],"B":[10,"3//utQDv////gO/////j7/cm7/jv9gC/+e/2AK/57/YB3/bv/b7/0O////8w7/3O/8Dv9gHf9u/2AI/77/YAf/3v9gCf/e/3Fe/77/////Xv////oN///scA"],"C":[10,"Aq7/6iAN////0X//7v/4z/wRz/zv+QCf/u/5AEd37/kAAADv+QAAAO/5AAAA7/kAAADv+QAAAO/5AAAA7/kAR3fv+QCf/s/8EM/8f//u//cN////0AKu/+kQ"],"D":[10,"3//+tgDv////oO/////17/oV7/vv+QC//e/5AK/97/kAr/3v+QCv/e/5AK/97/kAr/3v+QCv/e/5AK/97/kAr/3v+QC//e/6Fe/77/////Xv////oN///rYA"],"E":[10,"3/////zv/////O/////87/wRERHv/AAAAO/8AAAA7/wAAADv/pmTAO////YA7///9gDv/XdyAO/8AAAA7/wAAADv/AAAAO/8ERER7/////zv/////N/////8"],"F":[10,"3/////vv/////O/////77/wRERHv/AAAAO/8AAAA7/wAAADv/pmTAO////UA7///9QDv/XdyAO/8AAAA7/wAAADv/AAAAO/8AAAA7/wAAADv/AAAAN/7AAAA"],"G":[10,"Aq7/6iAd////0Y//7v/43/0Rz/3v+QCf/u/5AH3d7/kAAADv+QAAAO/5C8zL7/kP//7v+Q///u/5Aq/+7/kAj/7v+QCf/t/9Ed/9j//u//gd////0QKu/+og"],"H":[10,"3/kAr/zv+QCv/O/5AK/87/kAr/zv+QCv/O/5AK/87/kAr/zv/Znf/O/////87/////zv/HfP/O/5AK/87/kAr/zv+QCv/O/5AK/87/kAr/zv+QCv/N/5AK/8"],"I":[4,"3/vv/O/87/zv/O/87/zv/O/87/zv/O/87/zv/O/87/zv/N/7"],"J":[10,"AAAAj/4AAACP/gAAAI/+AAAAj/4AAACP/gAAAI/+AAAAj/4AAACP/gAAAI/+AAAAj/4AAACP/oqmAI/+z/oAj/7P+gCf/r/9EM/9b//u//gM////0QGe/+og"],"K":[11,"3/kAHv+u/5AH//Tv+QDf+w7/kI/+IO/5Hv+QDv+Y/+IA7/rv+gAO////MADv///zAA7///+QAO////4ADv/n//UA7/oN/8AO/5Bv/zDv+QDv+g7/kAj/8u/5AD//jf+QAM/9"],"L":[10,"3/sAAADv/AAAAO/8AAAA7/wAAADv/AAAAO/8AAAA7/wAAADv/AAAAO/8AAAA7/wAAADv/AAAAO/8AAAA7/wAAADv/AAAAO/8ERER7/////zv/////N/////8"],"M":[12,"7/sAAM/+//9ABf/+///QDf/+///3f//+///93//+///////+//vv/r/+//h/9p/+//gNwJ/+//gEQJ/+//gAAJ/+//gAAJ/+//gAAJ/+//gAAJ/+//gAAJ/+//gAAJ/+//gAAJ/+7/gAAI/+"],"N":[11,"3/4QCf/O//UAr/3v/5AK/97//gCv/e//9Qr/3v//oK/97//+Gv/e/+/1n/3v+u+Z/97/i/6v/e/4f/7/3v+S///97/kM///e/5Bv//3v+QHv/97/kAv//e/5AH//3f+AAu/8"],"O":[10,"Aa7/6hAN////wH//7v/2z/sAv/vv9gB//e/2AG/+7/YAb/7v9gBv/u/2AG/+7/YAb/7v9gBv/u/2AG/+7/YAb/7v9gB//c/7AL/7f//u//YN////wAGu/+oQ"],"P":[10,"7//+xgDv////gO/////j7/cV7/nv9gCf/O/2AH/97/YAn/zv9gTv+e/////j7////mDv/LuTAO/2AAAA7/YAAADv9gAAAO/2AAAA7/YAAADv9gAAAO/1AAAA"],"Q":[10,"AZ7/6AAM////sG//7v/0z/0S7/rv+QC//O/5AL/87/kAv/zv+QC//O/5AL/87/kAv/zv+QC//O/5AL/87/kAv/zv+QC//M/8Ad/6f//d//UN////wAK+/+oQ"],"R":[10,"3//+xwDv////kO/////z7/cV7/nv9gCf/O/2AH/97/YAr/zv+Djv+O/////i7////kDv+r/9AO/2T/8w7/YO/3Dv9gr/wO/2Bf/h7/YA7/Xv9gC/+t/2AH/9"],"S":[10,"Aq7/6BAd////sI//7v/0z/wC7/nv+QC/+9/7AHqnn/+AAAAu//oAAAb//7EAAE3//kAAAc//4QAAGv/4eIUAz/zf+gCv/b/9Ed/7f//u//YN////wAKu/+kQ"],"T":[11,"7//////P//////z//////8ERn/9REQAI//MAAACP/zAAAAj/8wAAAI//MAAACP/zAAAAj/8wAAAI//MAAACP/zAAAAj/8wAAAI//MAAACP/zAAAAj/8wAAAI//MAAAB//zAA"],"U":[10,"7/gAn/3/+ACv/f/4AK/9//gAr/3/+ACv/f/4AK/9//gAr/3/+ACv/f/4AK/9//gAr/3/+ACv/f/4AK/9//gAr/3v+ACv/c/9Ed/7f//u//UN////sAGu/+kQ"],"V":[12,"v/8wAO/9n/9QA//5b/9wBf/2P/+gCP/yDv/AC//QC//gDf+wB//yH/9wBP/0P/9QAe/3X/8gAM/6f/0AAJ/9n/oAAG/+z/YAAD////IAAA7//+AAAAz//7AAAAj//4AAAAT//1AAAAHv/iAA"],"W":[17,"z/4ADv9QC//q//ID//gA3/x//0Bf/6AP/5T/9wj//QP/9x//kL//8V//QN/7Df//Nv/yCv/R///1n/0Ab/9P//+L/6AD//j/v/rP9wAO/9/1797/QADP//8d///xAAn//+C///0AAG///An//6AAA///oG//9wAAHv/4BP//UAAAz/9gL//yAAAJ//QA7/4AAABf/iAM/7AA"],"X":[11,"3/oACv/Y/+AA7/gv/2Bf/yCv/Az/oAT/9f/0AAz/3/wAAG///2AAAe//4QAACv/6AAAAn/+QAAAO//4AAAX///UAAM/+/8AAP/9v/zAK/9DP+gLv9gb/4o/+AA7/jf+gAK/9"],"Y":[11,"3/sADP/Z/+AB7/lf/0Bf/0Dv+Qn/0An/0O/4AD//X/8gAM/8/7AAB///9wAAP///IAAA3//AAAAI//cAAABv/1AAAAb/9QAAAG//UAAABv/1AAAAb/9QAAAG//UAAABf/1AA"],"Z":[10,"3/////3f/////d/////9EREW//kAAAz/4gAAT/+gAAC//iAAA//6AAAL/+IAAE//kAAAv/8wAAPv+gAADP/iAABP/5AAAL//URER3/////3f/////d/////9"]},{"0":[11,"AF3//WAATv///2AN/+rf/iX/9AL/95/+AAz/u//AAK/9z/sACf/t/7AAn//f+wAJ//3/sACf/9/7AAn//P+wAJ/+v/wACv/Z/+AAz/tf/0Av/3Df/q3/4gTv///2AATf/9YA"],"1":[7,"AAA40AO//2z///7////tif/0AH//AAf/8AB//wAH//AAf/8AB//wAH//AAf/8AB//wAH//AAf/8AB//wAH//"],"2":[11,"AF3//nAAb////4Au/9rv/in/4QP/9s/5AA7/irtgAO/4AAAAL/9QAAAI/+EAAAPv9gAAAd/7AAAAr/4gAAB//1AAAD7/oAAAHP/RAAAM/+MAAAn//u7u7a//////6v/////+"],"3":[11,"AH7//XAAr////5Bf/9rv/0r/0ALv+XmWAAv/oAAAAM/6AAAALv9gAFmu/7AACP//sAAAj///kAABM47/YAAAAK/7AAAACP/rzGAAj/3P/AAd/7f//a7/9Qz////6ABjv/9cA"],"4":[11,"AAAC7/YAAACv/2AAAD//9gAAC///YAAE///2AAC/7f9gAD73z/YACv0M/2AD/3DP9gCv4Qz/YC76AM/2Cv/Lvv/Kz//////b//////0jMzPf+CAAAAz/YAAAAM/2AAAADP9g"],"5":[11,"Cf////9Qv/////UN/////1Dv8wAAAB//EAAAAv/gAAAAT/5ruTAF/////mB//8vv/jBJcAT/+AAAAAv/sAAAAJ/9AAAACf/c/6AAr/yf/hAe/4Pv/q7/4gf////3AAXf/9YA"],"6":[11,"AABJ3mAAAK//9gAAn///YAB//7MAAB7/kAAABv/gAAAAr/pKujAM/9///mDv/+7//i//4gf/+P/4AA3/v/9wAJ/87/cACf/L/5AAv/t//hA+/3Hv/q7/4gTv///1AATf/9UA"],"7":[11,"///////f//////3u7u7u/7AAAADf9gAAAE/+EAAACv+QAAAB7/MAAAB//AAAAA3/cAAABP/yAAAAn/wAAAAe/3AAAAX/8gAAAK/8AAAAHv9wAAAH/+IAAADP+wAAAD//UAAA"],"8":[11,"AG3//oAAf////6Au/+rf/zb/9QP/+I//IA//l//yAP/5T/9gT/9Qn/6+/7AAr///wAB/////kD7/k4//Wf/gAN/7z/wACv/c/9AAr/6v/zAe/8X//q3/9wr////8AAfv/+kQ"],"9":[11,"AF3//EAAX////jAu/+rv/Qj/9AX/9c/9AA7/nf+gAL/83/oACv/c/9AAv/2f/0A+/9T//r7//Ar/////sAbO1t/4AAAAL/9QAAAJ/+EAAUv/9gAI///5AACP//kAAAjskwAA"],"A":[15,"AAAF//QAAAAAAJ//gAAAAAAN//wAAAAABP//8wAAAACv/v+QAAAADv+P/gAAAAT/4e/zAAAAn/oL/4AAAA3/YH/9AAAD//ID//IAAH/+AA7/YAAM/+zM7/sAAf//////4QB///////9gDf/TMzPv/AP/+QAACv/yf/9AAABf/2v/4AAAAe/7"],"B":[12,"////7JMA//////5Q///////i//sAGv/3//sAA//5//sAAv/5//sABf/2//2Inv/A//////wA//////+w//wzOf/3//sAAO/8//sAAN/9//sAAO/9//sAGP/6///////0//////+A////7aQA"],"C":[13,"ABjv/+owAAz////+MAr//s3//RT/+gAH//ef/zAADv+7/+AAAN/93/0AAAEiLf/AAAAAAN/8AAAAAA3/wAAAAADf/AAAAAAN/9AAABIiv/4AAA3/2f/yAADv+0//oAB//3C//9vf/+EB3////+MAAZ7//qMA"],"D":[12,"///+yCAA/////+QA//////4w//kBXf/R//kAA//2//kAAN/5//kAAM/7//kAAL/8//kAAL/8//kAAL/8//kAAL/8//kAAM/7//kAAO/5//kABP/2//kBXf/h//////5A/////+UA///+yCAA"],"E":[10,"//////7//////v/////+//YAAAD/9gAAAP/2AAAA//YAAAD//Lu7sP/////g/////+D/+DMzIP/2AAAA//YAAAD/9gAAAP/2AAAA//////7//////v/////+"],"F":[10,"//////////////////////kAAAD/+QAAAP/5AAAA//kAAAD/+2ZmYv/////1//////X//JmZk//5AAAA//kAAAD/+QAAAP/5AAAA//kAAAD/+QAAAP/5AAAA"],"G":[13,"ABjv/+xQAAz/////cAr//sz//iP//BAG//iP/0AADf/L//EAAHqpz/4AAAAADf/gAAAAAN/+ADiIiI3/4AX///7f/gBf///s/+ABM8/+v/8QAAz/6P/1AADP/j//0QAd/+Cv/+zO//4Av/////5QAH3//+kg"],"H":[13,"//sAAAz/3/+wAADP/f/7AAAM/9//sAAAz/3/+wAADP/f/7AAAM/9//sAAAz/3//ZmZnv/f///////9////////3//GZmbf/f/7AAAM/9//sAAAz/3/+wAADP/f/7AAAM/9//sAAAz/3/+wAADP/f/7AAAM/9"],"I":[4,"3/7f/t/+3/7f/t/+3/7f/t/+3/7f/t/+3/7f/t/+3/7f/t/+"],"J":[11,"AAAAC//wAAAAv/8AAAAL//AAAAC//wAAAAv/8AAAAL//AAAAC//wAAAAv/8AAAAL//AAAAC//wAAAAv/8AAAAL//MzMAC//8//AAz/6v/1A//7T//s7/9Qr////6AAfv/+cA"],"K":[13,"//sAAN//j/+wAH//0P/7AB3/4w//sAr/9wD/+wX//AAP/7DP/iAA//tv/3AAD//N/8AAAP////0AAA/////1AAD/////wAAP//uf/3AA//4S//4QD/+wCf/3AP/7AB7/4Q//sACP/6D/+wAC7/8//7AACv/6"],"L":[10,"//kAAAD/+QAAAP/5AAAA//kAAAD/+QAAAP/5AAAA//kAAAD/+QAAAP/5AAAA//kAAAD/+QAAAP/5AAAA//kAAAD/+QAAAP/5AAAA//////z//////P/////8"],"M":[16,"//+AAAAI//7//8AAAAz//v//4QAAH//+///2AABv//7///oAAK///v///gAA7+/+//7/MAP/z/7/+/+ACP+P/v/3/8AM/W/+//bP8S/5b/7/9o/1f/Vv/v/3P/rP8X/+//cO/v/Af/7/9wr//5B//v/3Bv//QH/+//cB7/4Af/7/9wDP+wB//v/3AI/3AH/+"],"N":[13,"//wAAAr/3//1AACv/f//wAAK/9///0AAr/3///wACv/f///1AK/9//7/wAr/3/+d/2Cv/f/4f/0K/9//ge/1r/3/+Aj/yv/f/4Ae/+/9//gAf///3/+AAN///f/4AAf//9//gAAN//3/+AAAf//f/4AAAe/9"],"O":[13,"AAjv/+gQABz////9EAr//s7/+wP/+gAJ//SP/hAAHv+b/9AAAM/8z/sAAAr/3f+gAACf/t/6AAAJ/+3/oAAAn/7f+gAACf/s/7AAAK/+v/wAAAv/yP/hAADv+T//oACf/0Cv/+zf/8AB3////+IAAY7//pEA"],"P":[12,"////7YEA//////0g///////R//kAGP/3//kAAN/7//kAAL/9//kAAL/9//kAAe/7//tmfP/2///////A//////oQ//yZhzAA//kAAAAA//kAAAAA//kAAAAA//kAAAAA//kAAAAA//kAAAAA"],"Q":[13,"ABjv/+gQAB3////9EAr//s7/+wP/+gAK//SP/hAAHv+b/8AAAM/83/sAAAr/3f+gAACv/u/6AAAJ/+7/oAAAn/7f+gAACv/t/7AAAK/9v/wAAAz/yP/hAAHv+T//oACf/0Cv/+zf/7AB3////9EAAY7///5A"],"R":[12,"///+7HEA//////wQ//////+w//kAK//z//kABP/2//kAAv/3//kAA//2//kACP/z//2Zz/+w//////0Q/////+EA//tq//MA//kD//kA//kAz/4Q//kAT/+A//kADP/h//kABv/3//kAAe/8"],"S":[12,"AEz//8UABe////9wLv/8vv/jf/9QA+/5n/4AAL/8n/8gACMzX//VAAAAC///1xAAAI7//+cAAAO///+QAAADr//1AAAABO/8q7gAAK/+z/wAAJ//n/5QAN/9Lv/8vv/3Be/////AADvv/+gA"],"T":[12,"7///////7///////7///////AADP+wAAAADP+wAAAADP+wAAAADP+wAAAADP+wAAAADP+wAAAADP+wAAAADP+wAAAADP+wAAAADP+wAAAADP+wAAAADP+wAAAADP+wAAAADP+wAAAADP+wAA"],"U":[12,"7/oAAL/97/oAAL/97/oAAL/97/oAAL/97/oAAL/97/oAAL/97/oAAL/97/oAAL/97/oAAL/97/oAAL/97/oAAL/97/oAAL/97/oAAL/83/sAAM/8r/4gA+/5T//szv/jCv////9wAH3//8UA"],"V":[14,"v/4AAADv/Y//MAAD//lP/3AABv/1Dv+gAAr/4Qr/4AAN/7AG//IAL/9wAv/1AF//MADP+QCP/QAAf/0Az/gAAC//EO/zAAAN/0T/4AAACP+H/5AAAAX/u/9QAAAB7+7/IAAAAL///AAAAAB///gAAAAAP//0AAAAAA7/4AAA"],"W":[18,"v/wAB/+AAL/7n/4ACv+gAN/5b/8QDP/QAO/3T/8wDv/hAv/0H/9QT//0Bf/xDf9wf//4B//gC/+Qr//7Cf+wCP/A3+7+C/+QBv/i/7v/Lf9gA//2/4j/b/9AAf/6/2X/r/8QAN/+/zL/7/0AAK///gDv//oAAH///ADP//cAAD//+QCf//QAAA7/9wBv/+EAAAz/9AA//9AAAAr/8QAf/7AA"],"X":[13,"r/9gAD//o//8AAn/9Av/8gDv/ABP/5Bf/1AAv/4b/8AABP/5//YAAAz/7/0AAAA+//9QAAAAr//AAAAADP/9AAAABf//9gAAAd/+/+EAAG//f/9wAA3/wN/9AAX/9gf/9gDP/gAe/9BP/5AAr/9b//MABP/7"],"Y":[13,"z/4QAB7/xv/1AAX/9h7/oACv/hCf/gAO/5AC//UF//MADP+gn/wAAG/+Dv9gAADv+f/gAAAH///3AAAADv/+AAAAAJ//kAAAAAP/9AAAAAA//zAAAAAD//MAAAAAP/8wAAAAA//zAAAAAD//MAAAAAP/8wAA"],"Z":[12,"7//////87//////87//////5AAAAC//hAAAAX/9gAAAAz/wAAAAF//QAAAAd/7AAAACv/iAAAAP/+AAAAAv/0AAAAF//UAAAAN/8AAAAB//1AAAALv+wAAAAv//////+3//////+3//////+"]},{"0":[11,"B97//tgI//////nv/////+//9QX/////QD/////0A/////9AP/////QD/////0A/////9AP/////QD/////0A/////9AP/////QD/////1Bf//7//////o//////kH3v/+2A"],"1":[6,"////////////AM//AM//AM//AM//AM//AM//AM//AM//AM//AM//AM//AM//AM//AM//AM//"],"2":[10,"CN7/7WCf////9e/////6//0B7/v//ADv+//8AO/7AAAB//kAAAb/9gAALv/QAAHf/0AACP/6AAA+/+EAAd//YAAJ//sAAE7/4gAAz//////P/////8//////"],"3":[10,"CN7/7YCP////+O/////9//0Az/7//ADP/ru6AM/+AAAAz/4ABXfv/AAL///kAAv///gAAjTf/QAAAM/+u7kAz/7//ADP/v/9AM/+7/////2P////+Aje/+2A"],"4":[13,"AAAAz/4wAAAAf/+QAAAAHv/iAAAACf/5AAAAAu/+EAAAAJ//YAAAAC7/wAAAAAr/8wAAAAP/+gnMwADf/RC//wB//2AL//AM/+Qzz/9D3////////f///////5u7u77/+7AAAAC//wAAAAAL//AAAAAAv/8A"],"5":[11,"z/////+8//////vP/////7z/9gAAAM//YAAADP/2AAAAz//Lu5MM//////XP/////8MzMzj//gAAAD//4AAAA//+//9AP//v//QD//7//1Bf/+7//////Y//////gH3v/+1w"],"6":[11,"CN7//sUJ/////+Tv/////6//8wj/+///IG//v//yBJmW//8gAAAP//h3dRD//////i///////P//U3//7//yA//+//8gP//v//ID//7//zBf/+7//////Y//////gI3v/+1w"],"7":[10,"///////////////////9MzM5//gAAAv/8wAADv/QAABP/5AAAJ//UAAA7/4QAAb/+gAAC//1AAAe/+AAAH//kAAAz/9AAAL//gAABv/5AAAL//MAAB7/8AAA"],"8":[11,"CN7//sYJ//////bv/////8//4AH//P/9AA//z//QAP/87/0AD//L/+h4//k+/////Sn/////9+/+AB//z//QAP/8//0AD//P/9AA//z//gAf/87//////I//////YH3v/+1g"],"9":[11,"CN7//tgI//////jv/////+//9AP/////MC/////zAv////8wL/////MC///v/9u///f//////wfe////8AAAAv//RmYgL//7//YC//+//3A///r//////l//////kFzv/+2A"],"A":[13,"AAL///IAAABf//9QAAAI///4AAAAv///sAAADv/f/gAAA//4//IAAG//P/9gAAr/0O/6AADf+wv/0AAv/3B//yAE//QF//UAf/9TX/+ACv/////7AN//////4B//y7vP/yX/9AAE//Wf/xAAH/+c/9AAAN/9"],"B":[11,"/////tgP//////n//7vP/+//8QDv////EA7////xAO////8QDv/v//h4//z//////k//////+P//Q07/3//xAO////8QDv////EA7////xAO////+7z//v//////j////+2A"],"C":[11,"B97//tcI//////jv/8vP/+//8QH/////EB/////xAf////8QAzM///EAAAD//xAAAA//8QAAAP//EAAAD//xACIi//8QH/////EB/////xAf//7//Lz//o//////gH3v/+1w"],"D":[11,"3////tgN//////jf/7vP/+3/8gD//9//IA///f/yAP//3/8gD//9//IA///f/yAP//3/8gD//9//IA///f/yAP//3/8gD//9//IA///f/yAP//3/+7z//t//////jf///+2A"],"E":[10,"//////v/////+//////7//8QAAD//xAAAP//EAAA//8QAAD//7u7kP/////Q/////9D//0MzMP//EAAA//8QAAD//xAAAP//EAAA////////////////////"],"F":[10,"//////////////////////9AAAD//0AAAP//QAAA//9AAAD//0AAAP/////x//////H//8u7sf//QAAA//9AAAD//0AAAP//QAAA//9AAAD//0AAAP//QAAA"],"G":[11,"B97//tcI//////jv/8vP/+//8QD/////EA/////xAMzM//8QAAAP//EAAAD//xV3d3//8a//////Gv/////xAP////8QD/////EA/////xAP//7//Lz//p//////kI3v/+1w"],"H":[12,"3/8gAP//3/8gAP//3/8gAP//3/8gAP//3/8gAP//3/8gAP//3/8gAP//3/+Hd///3///////3///////3/+Hd///3/8gAP//3/8gAP//3/8gAP//3/8gAP//3/8gAP//3/8gAP//3/8gAP//"],"I":[4,"////////////////////////////////////////////////"],"J":[10,"AAAB//8AAAH//wAAAf//AAAB//8AAAH//wAAAf//AAAB//8AAAH//wAAAf//AAAB//8AAAH//7u7Af////8R/////xH/////Iv//7/////6P////+Aje/+2A"],"K":[12,"//8ACf/7//8AHv/0//8Af//A//8A3/9g//8D//4A//8I//kA//8N//QA//9P/9AA//+v/4AA//+f/5AA//8//+AA//8N//UA//8H//oA//8C//4Q//8Az/9w//8Af//A//8AHv/0//8ACf/7"],"L":[9,"3/4AAA3/4AAA3/4AAA3/4AAA3/4AAA3/4AAA3/4AAA3/4AAA3/4AAA3/4AAA3/4AAA3/4AAA3/4AAA3/4AAA3/4AAA3/////3/////3/////"],"M":[15,"//+QAACP/////QAADf/////0AAP//////4AAj//////8AAz///////IC/+////z/cH/8////jvsL/o////iv4e+o////hf+v9Y////ge/v4Y////gL//sI////gG//cI////gB//II////gAERAI////gAAAAI////gAAAAI////gAAAAI//"],"N":[11,"//wAC//v//IAv/7//3AL/+//+wC//v//4Qv/7///cL/+///9C//v/9/zv/7/+t97/+//qPy//v/6P/3/7/+g3//+//oI///v/6Au//7/+gDP/+//oAf//v/6AD//7/+gAM/+"],"O":[11,"CN7//tcJ//////Xv/////7//8QT/+///AD//v//wA//7//8AP/+///AD//v//wA//8//8AP//P//AD//v//wA//7//8AP/+///AD//v//yBf/77/////+4//////UI3v/+1w"],"P":[11,"3////tkN//////nf/////+3/8wH//9//MA///f/zAP//3/8wD//9//MA///f/2Nf//3//////d//////bf/8u7pQ3/8wAAAN//MAAADf/zAAAA3/8wAAAN//MAAADf/zAAAA"],"Q":[11,"CN7//tcJ//////Xv/////7//8QT/+///AD//v//wA//7//8AP/+///AD//v//wA//8//8AP//P//AD//v//wA//7//8AP/+///AD//v//xBP/77//u7/+4//////UI3v///A"],"R":[12,"3////tkA3/////+Q3//////g3/8wH//w3/8wD//w3/8wD//w3/8wD//w3/8wD//w3/+on//g3/////+g3/////wQ3/9u//EA3/84//cA3/8z//0A3/8w3/9A3/8wf/+w3/8wHv/03/8wCP/7"],"S":[11,"CN7//tgJ//////jv/////+//9QX/////QE/////0And3//9AAAAO//t3diC//////kLP/////QAjM4//8AAAA///iIggP/////QD/////1Bf//7//////o//////kH3v/+2A"],"T":[11,"//////////////////////AAf/+AAAAH//gAAAB//4AAAAf/+AAAAH//gAAAB//4AAAAf/+AAAAH//gAAAB//4AAAAf/+AAAAH//gAAAB//4AAAAf/+AAAAH//gAAAB//4AA"],"U":[11,"//8AD/////AA/////wAP////8AD/////AA/////wAP////8AD/////AA/////wAP////8AD/////AA/////wAP////8AD/////AA/////yAf//7//////o//////kI3v//2A"],"V":[13,"r/9QAE//tv/4AAf/+D//oACf/0Dv/AAL/+EM/+AA3/0An/8QHv+gBv/0A//3AD//cG//QAH/+Qj/8QAM/8DP/QAAn/4O/6AABf/0//YAAC//r/8wAADf/v/gAAAK///7AAAAb///cAAAA///9AAAAA7//gAA"],"W":[21,"z/9AAL//sAAv/8n/9gAO//4ABP/5b/+AAv//8QBv/2P/+gBP//8wCP/zDv/ABv//9QCv/gDP/gCP//+ADf/ACf/xC//f+gDv+QBv/zDf+P/AL/9gA//1Dv8//gT/8wAO/3P/0N/zf/4AAM/5b/sK/1n/wAAK/7j/gI/4v/oAAH/9v/UF/77/cAAF//7/IC/+//UAAC///+AA7///MAAA7//8AAz//+AAAAz//6AAn//8AAAAn//3AAb//5AA"],"X":[13,"j/+wAO/+Ee/+EE//oAn/9gr/9ABP/7Dv/QAA3/5v/4AABf/+/+EAAA3///gAAABv//4gAAAA7/+wAAAALv/9AAAACf//9QAAAe///8AAAI//v/9QAB7/0u/9AAb/9wv/9AC//iBv/6A//7AA7/4r//YACv/6"],"Y":[13,"3/8wAF//p//4AAr/9B7/wADv/QCv/xA//4AE//YH//MADf+gv/wAAI/+Hv+AAAT/9//zAAAO/9/+AAAAf///cAAAAv//8gAAAAv//AAAAAB//4AAAAAH//gAAAAAf/+AAAAAB//4AAAAAH//gAAAAAf/+AAA"],"Z":[11,"n//////5//////+f//////AAAAr/+wAAAv/+MAAAr/+QAAA+/+EAAAr/9gAAA//9AAAA3/8wAABv/6AAAB7/4wAACf/6AAAD7/8gAAC//6AAAA///////P//////z//////8"]},{"0":[11,"A77//sMA3////+Bf/+zv/2j/4QHv+a/8AAz/u//AAL/8v/sAC//M/7AAv/3P+wAK/9z/sACv/c/7AAv/2/+wAL/8v/wAC//K/8AAz/uP/hAe/5X//s7/9g3////+ADvv/+ww"],"1":[6,"AH7+Pf/+7//+7//+6q/+EG/+AG/+AG/+AG/+AG/+AG/+AG/+AG/+AG/+AG/+AG/+AG/+AG/+"],"2":[10,"jv///WCv////9K7czv/6EAAB7/wAAAC//QAAAL/9AAAB7/wAAF3/+QBL///kG////EB///5gAL//gQAAz/wAAADf+gAAAN/6AAAA3/////3f/////d/////9"],"3":[10,"zv//7EDv////4t3Mzv/4AAAC7/sAAADP/AAAAM/7AAAB7/gCu77/4QL///wwAv///7AAM0f/+AAAAM/9AAAAr/4AAACv/wAAAe/+7czO//r/////497//+xA"],"4":[11,"AAf/4QAAAM/7AAAAHv9wAAAF//IAAACf/AAAAA7/YAAABP/hBWMAn/sB/4AO/2BP+AT/4Qf/gI/7AK/4DP/czv/c3//////9//////8zMzPf+TAAAAz/gAAAAM/4AAAADP+A"],"5":[10,"v/////O/////87/////zv/gAAAC/+AAAAL/4AAAAv/pFUQC////+cL/////0vLu+//kAAAHv/AAAAM/9AAAAv/0AAADP/AAAAu/7zczO//jf////4r7//+sw"],"6":[11,"AH3//+wgf/////MO//3M3jX/9wAAAI/+AAAACv/AAAAAv/wDVTAM/8n//7DP/////1z/+5rv+s/9AAv/y//AAK/9r/wACf/Z/9AAr/xv/hAM/7L//s3/9wv////+ECvv//xA"],"7":[10,"3/////zf/////N/////8AAAA7/kAAAT/9AAACv/gAAAe/5AAAF//QAAAr/0AAADv+QAABP/0AAAJ/+AAAA3/oAAAP/9gAACP/xAAAM/7AAAD//YAAAj/4QAA"],"8":[11,"BL7//8UD7/////SP/9zf/6v/4ADf/L/8AAv/2//AAL/8j/0ADP+j7/p5//QEz///1QGu///+oY//Y17/nP/AAL/93/sACf/t/7AAr//f/gAN/+r//c3/+0//////UFz///xg"],"9":[11,"Bc///8QC7////+Cf/9zf/2z/4AH/+u/8AA3/z/+wAM/9//sADP/u/9AA7//P/6m///f//////wz//6z/4ANVMM/+AAAADf/AAAAA7/oAAABv/3TtzN//4k/////5A97//9gA"],"A":[13,"AAT///QAAAB///9wAAAK///6AAAA3/v/0AAAHv9f/xAABP/g7/QAAI/7DP+AAAv/kK/7AADv9gf/4AA//0Bf/zAF//EC//YAj//Mz/+QC//////7AO//////4C//czOP/zb/8gAD//af/gAADv+t/7AAAM/9"],"B":[11,"7///7ZIO/////9Dv/////27/oAPv+u/6AA3/vv+gAM/67/oAHv9+/9u9/9Hv////sg7/////oO/7M27/fv+gAM/77/oAC//e/6AAz/3v+gAu/87/////+O/////+Hv///tow"],"C":[9,"AZ7//9Cv///+Lv/9zeb/9wAAj/4AAAr/0AAAv/0AAAz/wAAAz/wAAAz/wAAAz/wAAAv/0AAAr/0AAAn/4AAAb/9wAALv/9zNCv////AZ7//9"],"D":[11,"7//+7IEO/////8Dv/////27/sAX/+u/7AA3/vv+wAL/97/sAC//e/7AAr/7v+wAK/+7/sACv/u/7AAr/7v+wAL/97/sAC//e/7AA3/vv+wBf/67/////9u/////8Dv//7sgQ"],"E":[9,"7////87////87////87/oAAA7/oAAA7/oAAA7/oAAA7/27uy7////z7////z7/szMw7/oAAA7/oAAA7/oAAA7/oAAA7////87////87////8"],"F":[9,"7////97////97////97/4AAA7/4AAA7/4AAA7/4AAA7/4zMw7////z7////z7////z7/4AAA7/4AAA7/4AAA7/4AAA7/4AAA7/4AAA7/4AAA"],"G":[11,"AH3///6gj/////0e//7MztX/+QAAAI//EAAACv/gAAAAv/0AAAAM/8AXd3fP/AL//+z/wC///s/8AXv/6//QAH/+r/0AB//o/+AAf/5f/3AH/+Hv/9zf/gn/////4Ajf///r"],"H":[11,"7/oACf/+/6AAn//v+gAJ//7/oACf/+/6AAn//v+gAJ//7/oACf/+/9u73//v//////7//////+/8d3z//v+gAJ//7/oACf/+/6AAn//v+gAJ//7/oACf/+/6AAn//v+gAJ//"],"I":[4,"3/7f/t/+3/7f/t/+3/7f/t/+3/7f/t/+3/7f/t/+3/7f/t/+"],"J":[6,"AG/+AG/+AG/+AG/+AG/+AG/+AG/+AG/+AG/+AG/+AG/+AG/+AH/9AI/9At/87//67//17ttw"],"K":[11,"7/gADP+u/4AD//Xv+ACP/Q7/gA7/YO/4Bv/QDv+Az/gA7/g//iAO/93/sADv///2AA7///+QAO/7r/4ADv+C//UA7/gM/7AO/4Bf/iDv+ADv+Q7/gAn/4e/4AE//bv+AAN/8"],"L":[8,"7/gAAO/4AADv+AAA7/gAAO/4AADv+AAA7/gAAO/4AADv+AAA7/gAAO/4AADv+AAA7/gAAO/4AADv+jMz7////u////7v///+"],"M":[16,"7//6AACP///v//0AAL///+///xAA3///7///MAH////v/v9gBf/v/+/5/4AI/7//7/bvsAv+j//v9s/QDvuP/+/2n/Ev+I//7/Zv9U/0j//v9j/4f/GP/+/2H/uf0I//7/YN/t+gj//v9gr//3CP/+/2Bv//UI//7/YD//8gj//v9gDv/gCP/+/2AM/7AI//"],"N":[11,"7/kABv/e/+EAb/3v/3AG/97//gBv/e//9Qb/3v//sG/97//+Nv/e///6b/3v/P/o/97/bv/v/e/1f///3v9R7//97/UJ///e/1A///3v9QDP/97/UAX//e/1AA3/3v9QAH/9"],"O":[11,"A77//8QB7////+N//9zf/5n/4ADP+7/7AAn/2/+gAI/+z/oAB//s/5AAf/7P+QAH//z/kAB//8/5AAf/7P+gAH/+v/oACP/r/7AAn/2f/gAM/7b//c3/+R7////+MDvv//xA"],"P":[11,"7///7ZIO/////9Dv/////17/sAT/+e/7AA3/vv+wAM/87/sADP/O/7AA3/vv+wA+/57/////9e/////8Dv///tkg7/sAAAAO/7AAAADv+wAAAA7/sAAAAO/7AAAADv+wAAAA"],"Q":[11,"A77//sQB7////+N//9zf/5n/4ADP+7/7AAn/2/+gAI/+z/oAB//s/5AAf/7P+QAH//z/kAB//8/5AAf/7P+gAH/+v/oACP/r/7AAn/2f/gAM/7f//c3/+B7////+IDvv///Q"],"R":[11,"7///7YEO/////8Dv/////07/gAX/9+/4AA7/jv+AAN/57/gADf+e/4AA7/jv+2av/27/////4e/////lDv/Jv/0A7/gD//QO/4AO/5Dv+ACv/g7/gAX/8+/4AB7/jv+AAL/8"],"S":[10,"A77//tQu////9Y//3M3lv/wAAADP+QAAAN/5AAAAz/wQAAC///2mEH/////SG/////kAFYz//AAAAL/9AAAAj/4AAACP/QAAAM/8jczO//mP////437///1Q"],"T":[11,"7//////u//////7v/////+Mzf/9zMwAE//UAAABP/1AAAAT/9QAAAE//UAAABP/1AAAAT/9QAAAE//UAAABP/1AAAAT/9QAAAE//UAAABP/1AAAAT/9QAAAE//UAAABP/1AA"],"U":[11,"z/wACf/s/8AAn/7P/AAJ/+z/wACf/s/8AAn/7P/AAJ/+z/wACf/s/8AAn/7P/AAJ/+z/wACf/s/8AAn/7P/AAJ/+z/wACv/r/8AAr/2v/hAN/8f//c3/+S7/////QEz///1g"],"V":[12,"z/oAAJ/9r/wAAL/6f/4AAN/3X/8gAf/1L/9QA//yDv+ABv/gC/+gCf+wCP/QC/+ABf/xDv9QAf/zL/8QAN/1T/0AAK/4b/sAAI/6j/gAAF/8r/YAAD/+7/MAAA7//+AAAAz//9AAAAr//6AA"],"W":[19,"3/sACv/7AAr/2//QAM//0ADP+5/+AA7//gAN/5f/8QH///IA//df/yAv//9AH/9U//QE/+/2A//zL/9Qb/n/gE//EO/3CP9f+gb/4Az/gK/h/8B/+wCf+gz8Df4J/5AH/8DvoK/xr/YAX/0v9wj/TP9AAv/l/0Bf9t/xAA7/n/ID/57+AADf/v4AD/7/wAAL///AAN//+gAAn//6AAv//4AAB///gACf//YA"],"X":[13,"j/9QAC//ke/7AAj/4gr/4QDv+wBf/2BP/1AA3/sJ/+AAB//i7/gAAB7/z/4QAACf//+gAAAE///0AAAAP///UAAACf//+wAAAe/8/+IAAH/+Hv+QAA3/kK/+EAX/9AX/9gC//QAe/8Au/4AAn/85/+IAA//6"],"Y":[12,"z/sAAK/6f/4AAO/2L/9QBP/hC/+gCf+gBf/hDv9AAO/0P/0AAJ/5f/gAAE/9z/MAAA7//9AAAAn//3AAAAT//zAAAADv/AAAAADP+wAAAADP+wAAAADP+wAAAADP+wAAAADP+wAAAADP+wAA"],"Z":[10,"r/////6v/////q/////+AAAF//kAAAv/8wAAP/+wAACf/jAAAe/6AAAJ//QAAD7/sAAAn/8wAAHv+gAACf/0AAAu/8AAAI//YAAAz/////7P/////s/////+"]},{"0":[9,"A7//xAHv7O/if/MC75v9AAz8z9AAv+39AAv+39AAv+39AAv+39AAv+39AAv+39AAv+39AAv+39AAv+z9AAv9v9AAz8f/UE74Hv///hAr7/sg"],"1":[8,"AAb9AABe/QAE7/0ALv79AK+Z/QAWCf0AAAn9AAAJ/QAACf0AAAn9AAAJ/QAACf0AAAn9AAAJ/QAACf0AAAn9AAr///8K////"],"2":[9,"BM//1QLv///jn/QH/6z8AB/8v5AB/8e2AE/5AAAI/0AAAN/AAAB/9gAAHv0AAAj/UAAB78AAAI/0AAAu+wAACf4wAALvsiIin////9n////9"],"3":[9,"BM//xAPv///ir+MI/3z6AC/5z4AC/5jGAC/5AAAD/2AAI7/RAA7/sQAAze6AAAAE/3AAAA38aVAA39v4AA39z6AA38r+QF/6X////jBt//xA"],"4":[10,"AAAe/1AAAG//UAAAz/9QAAL//1AAB/nPUAAN899QAD/A31AAn4DvUADvMO9QBv0A/1AM9wH/UD/zAf9Qn+VV/4Xf/////7zMzP/cAAAB/1AAAAH/UAAAAf9Q"],"5":[8,"n///+p////qflVVTn3AAAJ9wAACfcCEAn5z/oJ////efxF77NRAL/QAACf4AAAn+iiAJ/u8wCf7vQAr9z5A++n///+MI7/1Q"],"6":[9,"BM//wwLv7O/in+IB7438AAv677AAr477AAEh77AAAA78jexQ7////z7+QF/577AA3877AA3977AA3977AA38z8AA77n+QF/4Pv///iBM//xA"],"7":[8,"7////u////1FVV76AAA/9QAAj/EAAM+wAAL/cAAG/yAACvwAAA74AABf9AAAv+AAAe+wAAX/YAAK/yAADv0AAD/5AACP9QAA"],"8":[9,"A87/xAHv///ib/gG/4n/IA/6n/EA77n/EA76f/IA/4Hvko/iA+//5ACf7O+gb/MC74v9AAv9z9AAv+z9AAv+z+AAz9n/UE77Pv///0Bc//1g"],"9":[9,"BM//xALv///ij/UE75v+AAz8z9AAv+39AAv+39AAv+z9AAv+r+IB3+X/2t/+B+/rz+AAIQv+AAAAv+j6AAv+r7AAz8j+EC75Lv7O/iBM//xA"],"A":[10,"AAr/oAAADP/AAAAO/+AAAD/u8wAAb8z2AACfqfkAAM93/AAA71X+AAP/Mv8wBf4A71AI/QDfgAv7AL+wDfoir9Af////8U/8zM/0f/IAL/iv8AAP+9/QAA3+"],"B":[9,"7/7bYA7///+w79As/079AG/379AE/479AE/379AH/z79WO+Q7///oA7+q++g79AG/379AB/779AA/979AA/979AC/779Aq/37////A7/7bcQ"],"C":[8,"BM/+kB7///d/9Rz8v+AI/t/ABv3vwAS478AAAO/AAADvwAAA78AAAO/AAADvwAAA78AEqt/ABv6/4Ab+f/UL/B7///cDz/6Q"],"D":[9,"7/7bYA7///+A79Ar/i79AF/379AC/679AB/879AB/879AB/879AB/879AB/879AB/879AB/879AB/879AC/679AF/379Ar/i7///+A7/7rYA"],"E":[7,"7///3v///e+yIi77AADvsAAO+wAA77AADvxVUO///x7+zMHvsAAO+wAA77AADvsAAO+wAA77IiLv///e///9"],"F":[7,"7///3v///e+yIi77AADvsAAO+wAA77AADvxVUO///x7+zMHvsAAO+wAA77AADvsAAO+wAA77AADvsAAO+wAA"],"G":[9,"Ar//1AHv///if/YG/2v+AA3439AAz478AAm078AAAA78AAAA78AAAA78Af/978Aa3978AAr978AAr939AAr9v+AAz9f/YF/9Hv//z9A8/7Ht"],"H":[9,"79AA3979AA3979AA3979AA3979AA3979AA3979AA3979VV797////97+zM7979AA3979AA3979AA3979AA3979AA3979AA3979AA3979AA39"],"I":[3,"393939393939393939393939393939393939"],"J":[7,"AACP4AAI/gAAj+AACP4AAI/gAAj+AACP4AAI/gAAj+AACP4AAI/kcwj+v2CP7PYI/t9gn9v6DPtv//9gnv6A"],"K":[9,"77AE/177AK/g77Ae+A77B/4Q77DfoA77T/QA77r9AA7874AA7//0AA79/4AA77z9AA77b/QA77HvoA77Cf4Q77A/+A77AM/Q77AH/177AC76"],"L":[6,"74AA74AA74AA74AA74AA74AA74AA74AA74AA74AA74AA74AA74AA74AA74AA75Ii7///7///"],"M":[12,"7/gAAJ/97/wAAN/97/4QAf/97/9ABf/977+ACPv974+wDPj9727gDub971zzT7b972j3f3f972T6rzf973Dt3gf973DO+wf973CP+Af973Bf9Qf973Av8Qf973AJkAf973AAAAf973AAAAf9"],"N":[9,"73AAf+79AAf+7/MAf+7/gAf+7/0Af+7/9Af+79+wf+74/hf+7132f+72j7b+73L/f+73C/z+73Bf/+73AN/+73AI/+73AD/+73AA3+73AAb+"],"O":[9,"Ar//sgDf///Rb/YG/2r+AA76z+AA7839AA3939AA3939AA3939AA3939AA3939AA3939AA3939AA39z+AA78r+AA76b/YG/1Df///AAr7+oQ"],"P":[8,"7+7HAO///7DvgY/174AN+u+AC/zvgAr974AK/e+AC/zvgAz674A+9u+579Dv//0w77dAAO+AAADvgAAA74AAAO+AAADvgAAA"],"Q":[9,"A7//wwHv///hf/YG/4v+AA7739AAz978AAz+78AAz+78AAz+78AAz+78AAz+78AAz+78AAz+78AAz+39AAz9v+AA77b/cW/2Df///QAa7+kQ"],"R":[9,"7/7aMA7///5A77A9/Q77AG/077AF/277AF/277AF/277AG/077AM/g79rf9w7///YA77b/QA77DfoA77CP4Q77Au+A77AL/Q77AG/177AB76"],"S":[9,"A77/xAHf///if/UG/4r+AA36r/IAv6f/oAi1Hv9wAAB//kAAAL/9EAAB3/wAAALv+QAABO/ia2AJ/5v5AC/8z8AA/9r/QF/6Pv///iBd//xA"],"T":[9,"3////+3////+Ii3+IiAA3+AAAA3+AAAA3+AAAA3+AAAA3+AAAA3+AAAA3+AAAA3+AAAA3+AAAA3+AAAA3+AAAA3+AAAA3+AAAA3+AAAA3+AA"],"U":[9,"79AAz+79AAz+79AAz+79AAz+79AAz+79AAz+79AAz+79AAz+79AAz+79AAz+79AAz+79AAz+79AAz+39AA39v+AA77f/YG/3Hf///hA8//ww"],"V":[10,"3+AAD/yv8QAv+Y/zAE/2X/UAb/Mv9gCP4A75AK/AC/oAz5AJ/ADvcAb+Af9ABP8T/yAB/0b+AADfaPsAAK+K+AAAf731AABP7vIAAB//4AAADf/AAAAL/5AA"],"W":[15,"77AAj8AAv+v9AAv+AAz7n+AA7/IA75f/EC//UB/3T/IE//cC/1L/QH/fkE/yDvYJ+PwF/gDPcM9f4G/QCvkO8u8o+wCPov4N9Z+QBvxfwK+L9wBP1/kH+b9QAv6fYE+88wAO7fIB/u8QAN/+AA3/4AAL/8AAv/wAAI/6AAn/kAAG/3AAb/cA"],"X":[9,"v+EA77b/QD/2HvgH/hC/wL+wBv8u9gAe+/4QAJ//kAAD//MAAA39AAAA38AAAE//MAAK//kAAe+v4QBv4u9gC/sL+wHvcH/hb/ID/2v9AA77"],"Y":[10,"v9AADvx/8gA/9z/2AG/yDfoAn8AI/gDPgAP/Mf9AAN9l/gAAn5n6AABf3fUAAB7/4AAAC/+gAAAG/2AAAAX/UAAABf9QAAAF/1AAAAX/UAAABf9QAAAF/1AA"],"Z":[9,"Df///+Df///9AiIo/3AAAM/hAAAv+gAACP9QAADf4AAAT/gAAAr/IAAC77AAAI/0AAAO/QAABf+AAACv8wAAHvwAAAf/giIiz////+3////+"]},{"0":[8,"CO/+gG////W/5V7676AL/e+QCv7/kAr+/5AK/v+QCv7/kAr+/5AK/v+QCv7/kAr+/5AK/u+QCv7foAv8r+NO+l////QJ//6A"],"1":[5,"AG/gXv7P/+/N/iDP4Az+AM/gDP4Az+AM/gDP4Az+AM/gDP4Az+AM/gDP4Az+"],"2":[7,"Cv/5Bf//9a/U3634CP3vcH/u9wf+/3CfwiEN+AAH/hAB75AAn+EAPvcACv4QAu+AAH/hAAr8IiHP//+s///6"],"3":[8,"Cu/+cH////W/5X/678AN/f+wDP4AAA39AAAe+gAp3+MAP/9wACnf9AAALvoAAA39/6AM/u+gDP3voA38v+Nv+W////MJ7/1Q"],"4":[8,"AAb/oAAK/6AADv+gAE/voACez6AA28+gAvfPoAbzz6AL4M+gDrDPoE9wz6CfMM+g31TPtP/////MzO/sAADPoAAAz6AAAM+g"],"5":[7,"z///fP//98+3dzz3AADPcAAM+ZtQz+/+PP1++c9wr8AACv0AAK/QAAr+zGCv3/cK/e9wr837Pfqf//9Rv/6Q"],"6":[8,"CO/+cF////Ov5X/338AP+e+wD/r/oAIh/6FDAP/e/8H////4/+Iu/P+gDP3/oAv+/6AL/++wC/7fwAz+v+VO+2////cK//+g"],"7":[8,"//////////93d379AAA/+QAAn/MAAN/AAAP/YAAI/gAADfoAAD/2AACP8gAA39AAAv+wAAX/gAAI/1AACv8wAAz/IAAN/yAA"],"8":[8,"Ce/+oG////e/4i7739AN/d/ADP3PwAz8n+AO+T76r+Mc///Af/d/9r/QDvvvsAz9/7AM/v+wDP7vwA39v+RO+m////UH7/5w"],"9":[8,"Ce/+kG////a/5n/738AO/e+wDv7/sA3/77AN/9/ADf+/4y7/b////wnv7v8AEg3/NDAN/8/ADf6/0A78n+VO+U///+MH7/1g"],"A":[9,"AG//QAAI//cAAK//kAAN/vwAAP+v4AAv9/8gBP8/9ABv4O9gCf0M+AC/sL+gDPoJ/ADvgH/gL/lI/yT////0b/zM/2j/EA74r+AAz6z8AAr9"],"B":[8,"///9UP///+L/so/3/6Av+P+gL/n/oC/4/6BP9f/s77D///+g/7Nv9/+gDfv/oAz9/6AM/v+gDP3/oA38/8N/+f///+P//+tA"],"C":[8,"B+/+cE////Wv9m/639AN/e+wDP7/sAz+/7AM/v+wARH/sAAA/7AAAP+wBWX/sAz+/7AM/u+wDP3fwA38n+Rv+T////QF3/1g"],"D":[8,"///9YP////T/wn/6/7AN/f+wDP7/sAz+/7AM/v+wDP7/sAz+/7AM/v+wDP7/sAz+/7AM/v+wDP3/sA38/8N/+P///+P//+tA"],"E":[6,"///7///7/8d1/5AA/5AA/5AA/5AA/8d0///4/9zH/5AA/5AA/5AA/5AA/5AA/8d2///9///9"],"F":[6,"///9///9/8d2/5AA/5AA/5AA/5AA/+zI///6/8mW/5AA/5AA/5AA/5AA/5AA/5AA/5AA/5AA"],"G":[8,"B+/+oE////ev9l7739AK/u+wCv7/sAr//7ADVf+wAAD/sMzM/7Dv//+wKP//sAf//7AH/++wB//f0An/r/VO/0///88G7+de"],"H":[8,"/6AM/v+gDP7/oAz+/6AM/v+gDP7/oAz+/6AM/v/arv7////+/9me/v+gDP7/oAz+/6AM/v+gDP7/oAz+/6AM/v+gDP7/oAz+"],"I":[3,"/9/9/9/9/9/9/9/9/9/9/9/9/9/9/9/9/9/9"],"J":[8,"AAAP/QAAD/0AAA/9AAAP/QAAD/0AAA/9AAAP/QAAD/0AAA/9AAAP/TMwD/3/0A/9/9AP/f/QD/3v4A/8v/Vv+V///+IH7/1Q"],"K":[9,"/9AG/3/9AL/y/9Ae/A/9Bv9w/9DP8g/9L/sA/9f/YA/9z+AA/+/6AA/+77AA/9v+IA/9b/gA/9Hv4A/9C/9A/9BP+Q/9AN/g/9AJ/1/9AE/7"],"L":[6,"/5AA/5AA/5AA/5AA/5AA/5AA/5AA/5AA/5AA/5AA/5AA/5AA/5AA/5AA/5AA/7VU///9///9"],"M":[12,"//gAAI////sAAL////0AAN////8gAf////9QBP///++AB/7//7/ACvv//47gDvj//33zL9f//3r2T6f//3f4f4f//3T7n1f//3L+zzf//3Dv7gf//3C//Af//3B/+Af//3BP9Qf//3Ad0gf/"],"N":[8,"/zAF//9wBf//wAX///IF///3Bf///AX//+4l//+/hf//btX//1z4//9X/f//Uv///1DP//9Qb///UB7//1AK//9QBf//UAHv"],"O":[8,"CO/+cF////Sv9m/638AN/e+wDP7/oAz+/6AM/v+gDP7/oAz+/6AM/v+gDP7/oAz+/6AM/u+wDP3fwA38r+Rf+V////QJ//6A"],"P":[8,"///9cP////X/wm/6/7AO/P+wDP3/sAz+/7AM/f+wDvv/1q/4////4v/syjD/sAAA/7AAAP+wAAD/sAAA/7AAAP+wAADdoAAA"],"Q":[8,"CO/+cF////Sv9m/638AN/e+wDP7/oAz+/6AM/v+gDP7/oAz+/6AM/v+gDP7/oAz+/6AM/u+wDP3fwA38r+Rf+V////QJ//6A"],"R":[8,"///9kP////f/w277/7AN/f+wDP7/sAz9/7AO/P/Yv/f////A/9m/9/+wDfz/sAv+/7AL/v+wC///sAv//7AL//+wC///sAv/"],"S":[8,"Gv/+UI///+HP0l/176AP+O+wD/jP4wzHj/0gAB3/0gAC3/0gAC7/sAAD7/SqcH/7/6Af/u+gDv7fsA79r+Rf+l////QH7/5w"],"T":[7,"/////////1Xf5VAM/gAAz+AADP4AAM/gAAz+AADP4AAM/gAAz+AADP4AAM/gAAz+AADP4AAM/gAAz+AAC9wA"],"U":[8,"/6AM/v+gDP7/oAz+/6AM/v+gDP7/oAz+/6AM/v+gDP7/oAz+/6AM/v+gDP7/oAz+/6AM/u+wDP7vsA39v+Re+l////QI7/1g"],"V":[9,"37AAv8v9AA36n+AA74b/IB/2T/QD/0L/YF/yDvgH/gDPsI/ACf0K+gBv4M9wBP8d9QAf9O8gAO+P4AAM/P0AAJ//sAAH//kAAF//cAAD//UA"],"W":[13,"z5AI/AB/6voAr+AI/J/ADP8Qr7f+AO/zC/lf8R//UN9z/yP/9g72H/NP34H/QO9W+Pov8g33j07D/xC/ivLOX+AJ+c4K9/wAj77Aj6+wBv36Bv35AE//gE//gAL/9gL/9gAf/0AP/0AA7/IA3/MADP8ADP8Q"],"X":[8,"v2AL+m+wDvYv4T/yDPaPwAf7z4AC/u9AAN/+AACP+gAAX/YAAJ/0AADf+QAC//4ABv7vQAr7r4AO91/QP/MO83/gCvi/oAb8"],"Y":[9,"39AA38j/IC/4T/YF/0DvoI/gCv0M+gBv8+9gAv+/8wAM//0AAH//kAAD//QAAA3+AAAAz+AAAAz+AAAAz+AAAAz+AAAAz+AAAAz+AAAAz+AA"],"Z":[7,"n///+f///0d5/9AAb/kACv9AAO/gAE/6AAn/YADf8QA//AAH/3AAv/IADv0ABf+QAK/1AA7/h3b////P///8"]},{"0":[7,"Bc7FBf//9M/p7775Cf7/kJ//+Qn//5Cf//kJ//+Qn//5Cf//kJ//+Qn//5Cf//kJ/++Qn+38PP2P//+Av/+w"],"1":[4,"AK8I/9//vf8G/wb/Bv8G/wb/Bv8G/wb/Bv8G/wb/Bv8G/wb/"],"2":[7,"Bt7WBf//9b/n7776Cv7vkJ/sxwr9AADPsAAe9wAG/yAAv9AAL/cACv4QAu+AAL/hAE/3AA3+Zmb/////////"],"3":[7,"Bt7EBP//4q/k7536DPvvkM+zMgz6AADvcASv4gDP+AAM/9AABe9gAAv7EQCf7vkJ/t+Qn9v8Hfpf//4wjv5g"],"4":[8,"AAT/kAAJ/5AADf+QAE//kACf/5AA7t+QBfvPkAn3z5AO88+QP+DPkH+gz5DPc8+j//////////8AAM+QAADPkAAAz5AAAK2A"],"5":[7,"3///rf//+t+5mW32AADfYAAN9kUQ3+/+Pf//+t/Av+VjCf8AAJ/wAAn/IhCf/vkJ/t+Qn+v8DPxv//9wr/+Q"],"6":[7,"B97XBf//9r/T3875Cf7/kJ//+QAA/6eED///9f/o78/5Cf7/kJ//+Qn//5Cf//kJ/++Qn+37C/1///9wrv6Q"],"7":[7,"/////////5mZ7+AADvwAA/+gAF/3AAj/QACv8gAN/gAB/7AAP/gABf9QAI/yAAv+AADfsAAf+QAF/2AAj/MA"],"8":[7,"B97XBf//9q/k76z8DPvPwM/M/Az8v9DPt/+u9w3//Qf///ffw8/e+Qn+/5Cf//kJ/++Qn+38PP2P//+Anv6g"],"9":[7,"Bt7XBv//9s/Dz875Cf7/kJ//+Qn//5Cf//kJ/++Qn/z+bv9////we6v/AACf/McJ/++Qn+z8DPyP//9wr/6g"],"A":[9,"AD//IAAG//UAAJ//gAAM//oAAO/f0AAv+v8QBP9v8wBv8v9QCP4O+AC/wN+gDfoL/ADvts/gL////xT////zf/do/2n/EC/4v9AA76zaAAvb"],"B":[7,"/+2RD///0P/M/3/5Dfr/kJ+/+Qn7/5Dfj/zP4v//+A///+P/k++f+Qr9/5Cf7/kJ/v+Q38/8z/j///0f/+og"],"C":[7,"Bc7FBf//5M/p3775Bv7/kG//+Qb//5AUT/kAAP+QAA/5AAD/kAAP+QAA/5Bd3/kG/++Qb+39O/2P//+Bv/+w"],"D":[7,"/+2RD///sP/N/0/5L/j/kN+/+Qz9/5DP7/kM/v+Qz+/5DP7/kM/v+Qz+/5DP3/kN+/+S/4/83/T///sP/tkQ"],"E":[6,"///9///9/8mY/5AA/5AA/5AA/5AA/8mQ///w///w/6Mw/5AA/5AA/5AA/5AA/9zK///9zMzK"],"F":[6,"/////////8mZ/3AA/3AA/3AA/3AA/8lw///A///A/5Mg/3AA/3AA/3AA/3AA/3AA/3AA3WAA"],"G":[7,"Bc7FBP//9L/p7775Cf7/kJ//+Qn//5BZn/kAAP+QAA/5e7v/mv//+Y3//5Cf//kJ/++Qn/37C/+v///y3/zP"],"H":[7,"/5Cf//kJ//+Qn//5Cf//kJ//+Qn//5Cf//yc////////////o6//+Qn//5Cf//kJ//+Qn//5Cf//kJ//+Qn/"],"I":[3,"////////////////////////////////////"],"J":[4,"Cf8J/wn/Cf8J/wn/Cf8J/wn/Cf8J/wn/Cf8J/wn/bv3f+d6h"],"K":[8,"/5Av9/+Qn+H/kO+g/5X/QP+a/AD/nvcA/+/2AP//+gD///0A//7/EP/o/0D/o/+A/5DvsP+Qv+D/kH/z/5A/9v+QDvr/kAv9"],"L":[6,"/5AA/5AA/5AA/5AA/5AA/5AA/5AA/5AA/5AA/5AA/5AA/5AA/5AA/5AA/5AA/7Zm////////"],"M":[10,"//cAf///+gCf///8AL////4A7////yH/////Q/7//99m+v//r5j4//+OuuX//33c1f//e+61//95/5X//3f/df//dP9V//9y/zX//3DvBf//cN0F//9wuwX/"],"N":[8,"/5AJ///gCf//9An///gJ///8Cf///xn///9Z///vqf//r+n//338//95/v//dP///3Dv//9wr///cG///3Ae//9wDP//cAf/"],"O":[7,"Bc7FBf//9c/p7875Cf7/kJ//+Qn//5Cf//kJ//+Qn//5Cf//kJ//+Qn//5Cf//kJ/++Qn+39PP2P//+Av/+w"],"P":[7,"/+2RD///wP/M/3/5Dfz/kJ/v+Qn+/5Cv3/k++v///0///5D/2lAP+QAA/5AAD/kAAP+QAA/5AAD/kAAN2AAA"],"Q":[7,"Bt6zBf//0M/a/272Dfj/YM+f9gz5/2DPn/YM+f9gz5/2DPn/YM+f9gz5/2DPn/YM+e9gz436Tvef//8hz//8"],"R":[7,"/+2SD///0f/M/4/5Dfz/kJ/v+Qn+/5C/z/p/+P///R///0D/vvYP+b+Q/5j8D/lv4P+T/z/5H/b/kN+v+Qr9"],"S":[7,"A87FAu//5I/n76v8C/2/wI25/hAAX/cAAN/hAAT/sAAK/1AALv0AAH/3AAHvzNkK/u+gn+v9HPx///9wv/+w"],"T":[7,"/////////5nf2ZAM/AAAz8AADPwAAM/AAAz8AADPwAAM/AAAz8AADPwAAM/AAAz8AADPwAAM/AAAz8AACtoA"],"U":[7,"/5Cf//kJ//+Qn//5Cf//kJ//+Qn//5Cf//kJ//+Qn//5Cf//kJ//+Qn//5Cf//kJ/++Qn+z9bfx///9gjv6A"],"V":[8,"v6AK/J/ADPp/4A73X/EP9S/yL/MO9E/xDfZv0Ar3j7AI+a+QBvrPcAT831AC/O8gAO7+AADP/QAAr/sAAI/4AABf9gAAPdMA"],"W":[12,"73AP4An8z5Av8Az6r8BP8g74j+Bv9A/2b/CP9g/0T/Kf+B/yL/S/+T/wDvbf+1/QDfjt7Y+wC/v7zq+gCf/5r/+AB//3j/9gBf/0b/9AA//yT/8gAf/gL/4AAO/QDvwAAM+wDPoAAI2ACdcA"],"X":[8,"z6AL/H/gHvcv9F/yDPivwAf873AC//8gAM/8AAB/9wAAP/MAAH/2AAC/+gAB7/4ABf3vUAr5v5AO9n/QT/I/84/QDvjfkAr8"],"Y":[8,"35AJ/Z/ADPlf4R71L/Rf8Q33n9AJ+9+QBf7/UAHv/hAAz/wAAJ/5AABv9gAAb/YAAG/2AABv9gAAb/YAAG/2AABv9gAAXdUA"],"Z":[7,"b///9v///zmZ7+AAHvoAB/9QAN/hAD/7AAj/YADf4QAv/AAH/3AAz/IAH/wABv9gAL/hAA79mZn/////////"]},{"0":[9,"i8zMuWvu7v7Yz+3f/qz+u97rz9qt7rz9qt7rz9qt7rz9qt7rz9qt7rz9qt7rz9qt7rz9qt7rz9qt7rz9qt7rztqt7rzuzN7qvv7u/Zi8zMym"],"1":[5,"Jrynruy+/8zv663/t778Su/Dnvs578Oe/Dnvw578Oe/Dnvw578Oe/Envw3va"],"2":[9,"aszMy3ne7u/qru7e/sru3M7rru283sermb3rNVV73rABSM7aAAWt7ZACfO63AFruyEA43+piJr78gwSd/qUQe+7ZUhnf7bh2vv/u3anN3d3K"],"7":[7,"nLvLmc3v61it/rA3z9kCfO2AKN7HBJ3rYFrtpRe+2UON/YNJ3sclrutRa+2UB87YMI3scgnuthC/6lEK24MA"]}]};
  var GW = 10, GH = 16, TW = 40, TH = 14;
  // ---------- utilidades de imagen (matrices en escala de grises, Float32Array, fila por fila) ----------
  function img(w, h, a) { return {w: w, h: h, a: a || new Float32Array(w * h)}; }
  function sub(m, x0, y0, x1, y1) {
    var w = Math.max(1, x1 - x0), h = Math.max(1, y1 - y0), o = img(w, h);
    for (var y = 0; y < h; y++) for (var x = 0; x < w; x++) o.a[y * w + x] = m.a[(y0 + y) * m.w + x0 + x];
    return o;
  }
  function resize(m, w, h) {  // bilineal con promedio por área al achicar
    var o = img(w, h), sx = m.w / w, sy = m.h / h;
    for (var y = 0; y < h; y++) for (var x = 0; x < w; x++) {
      var ya = y * sy, yb = ya + sy, xa = x * sx, xb = xa + sx, s = 0, n = 0;
      if (sx <= 1 && sy <= 1) {
        var fx = Math.min(m.w - 1, Math.max(0, (x + .5) * sx - .5)), fy = Math.min(m.h - 1, Math.max(0, (y + .5) * sy - .5));
        var x0 = Math.floor(fx), y0 = Math.floor(fy), x1 = Math.min(m.w - 1, x0 + 1), y1 = Math.min(m.h - 1, y0 + 1), dx = fx - x0, dy = fy - y0;
        o.a[y * w + x] = m.a[y0 * m.w + x0] * (1 - dx) * (1 - dy) + m.a[y0 * m.w + x1] * dx * (1 - dy) + m.a[y1 * m.w + x0] * (1 - dx) * dy + m.a[y1 * m.w + x1] * dx * dy;
        continue;
      }
      for (var yy = Math.floor(ya); yy < Math.min(m.h, Math.ceil(yb)); yy++) for (var xx = Math.floor(xa); xx < Math.min(m.w, Math.ceil(xb)); xx++) { s += m.a[yy * m.w + xx]; n++; }
      o.a[y * w + x] = n ? s / n : 0;
    }
    return o;
  }
  function vec(m, w, h) {  // vector normalizado (media 0, norma 1) para comparar por correlación
    var r = resize(m, w, h).a, s = 0, i, n = 0;
    for (i = 0; i < r.length; i++) s += r[i];
    var mu = s / r.length;
    for (i = 0; i < r.length; i++) { r[i] -= mu; n += r[i] * r[i]; }
    n = Math.sqrt(n) || 1;
    for (i = 0; i < r.length; i++) r[i] /= n;
    return r;
  }
  function dot(a, b) { var s = 0; for (var i = 0; i < a.length; i++) s += a[i] * b[i]; return s; }
  function pct(m, p) {  // percentil de una matriz con valores 0..255
    var h = new Uint32Array(256), i;
    for (i = 0; i < m.a.length; i++) h[Math.max(0, Math.min(255, m.a[i] | 0))]++;
    var k = p * m.a.length, c = 0;
    for (i = 0; i < 256; i++) { c += h[i]; if (c >= k) return i; }
    return 255;
  }
  // ---------- plantillas ----------
  function dec(w, b64) {
    var bin = atob(b64), m = img(w, T.h), n = w * T.h;
    for (var i = 0; i < n; i++) { var byte = bin.charCodeAt(i >> 1); m.a[i] = ((i & 1) ? byte & 15 : byte >> 4) / 15; }
    return m;
  }
  var FUENTES = T.f.map(function (f) { var o = {}; Object.keys(f).forEach(function (c) { o[c] = dec(f[c][0], f[c][1]); }); return o; });
  var DIG = {};  // dígito -> [{v, asp}]
  FUENTES.forEach(function (f) { '0123456789K'.split('').forEach(function (c) { if (f[c]) (DIG[c] = DIG[c] || []).push({v: vec(f[c], GW, GH), asp: f[c].w / f[c].h}); }); });
  var SIG = {};  // siglas -> [{v, asp}] (se arman al pedirlas)
  function plantillaSiglas(code) {
    if (SIG[code]) return SIG[code];
    var out = [];
    FUENTES.slice(0, -1).forEach(function (f) {
      var gl = code.split('').map(function (c) { return f[c]; });
      if (gl.some(function (g) { return !g; })) return;
      var gap = Math.round(T.h * 0.1), w = gl.reduce(function (s, g) { return s + g.w; }, 0) + gap * (gl.length - 1), m = img(w, T.h), x = 0;
      gl.forEach(function (g) { for (var y = 0; y < g.h; y++) for (var i = 0; i < g.w; i++) m.a[y * w + x + i] = g.a[y * g.w + i]; x += g.w + gap; });
      out.push({v: vec(m, TW, TH), asp: w / T.h});
    });
    return (SIG[code] = out);
  }
  // ---------- recorte del video ----------
  var CV = null;
  // z = [x0, y0, x1, y1] relativo al cuadro; modo 'blanco' (texto claro) o 'color' (siglas en azul/rojo)
  function recorte(v, z, modo) {
    var vw = v.videoWidth || v.naturalWidth || v.width, vh = v.videoHeight || v.naturalHeight || v.height, sx = z[0] * vw, sy = z[1] * vh, sw = (z[2] - z[0]) * vw, shh = (z[3] - z[1]) * vh;
    var k = Math.max(1, Math.min(8, 60 / shh)), w = Math.max(4, Math.round(sw * k)), h = Math.max(4, Math.round(shh * k));
    if (!CV) CV = document.createElement('canvas');
    CV.width = w; CV.height = h;
    var x = CV.getContext('2d', {willReadFrequently: true});
    x.imageSmoothingEnabled = true; x.imageSmoothingQuality = 'high';
    x.drawImage(v, sx, sy, sw, shh, 0, 0, w, h);
    var d = x.getImageData(0, 0, w, h).data, m = img(w, h);  // falla si el video está protegido
    for (var i = 0, j = 0; j < m.a.length; i += 4, j++) {
      var mx = Math.max(d[i], d[i + 1], d[i + 2]), mn = Math.min(d[i], d[i + 1], d[i + 2]);
      m.a[j] = modo === 'color' ? (mx > 90 ? Math.min(255, (mx - mn) * 1.6) : 0) : mn;
    }
    return m;
  }
  // ---------- números: reloj (mm:ss), oro (3.1K) y kills ----------
  function columnas(ink, w, h, y0, y1) {
    var segs = [], x = 0;
    function col(x) { for (var y = y0; y < y1; y++) if (ink[y * w + x]) return true; return false; }
    while (x < w) { if (col(x)) { var a = x; while (x < w && col(x)) x++; segs.push([a, x]); } else x++; }
    return segs;
  }
  function filasDe(ink, w, a, b, y0, y1) {
    var t = -1, u = -1, rows = [];
    for (var y = y0; y < y1; y++) { var r = false; for (var x = a; x < b; x++) if (ink[y * w + x]) { r = true; break; } rows.push(r); if (r) { if (t < 0) t = y; u = y + 1; } }
    return {t: t, u: u, rows: rows};
  }
  function clasificar(g, letras) {
    var v = vec(g, GW, GH), asp = g.w / g.h, mejor = {}, best = null, seg = null;
    letras.split('').forEach(function (c) {
      (DIG[c] || []).forEach(function (t) {
        var s = dot(v, t.v) - 0.8 * Math.abs(Math.log((asp + 0.05) / (t.asp + 0.05)));
        if (mejor[c] == null || s > mejor[c]) mejor[c] = s;
      });
    });
    Object.keys(mejor).forEach(function (c) { if (!best || mejor[c] > mejor[best]) { seg = best; best = c; } else if (!seg || mejor[c] > mejor[seg]) seg = c; });
    if (best === '0' || best === '8') {  // el 0 y el 8 se separan por el centro: hueco en el 0, trazo en el 8
      var p = [], cx0 = Math.floor(g.w * 0.4), cx1 = Math.max(cx0 + 1, Math.ceil(g.w * 0.6));
      for (var y = 0; y < g.h; y++) { var s2 = 0; for (var x = cx0; x < cx1; x++) s2 += g.a[y * g.w + x]; p.push(s2 / (cx1 - cx0)); }
      var rng = function (a, b) { return p.slice(Math.floor(g.h * a), Math.max(Math.floor(g.h * a) + 1, Math.ceil(g.h * b))); };
      var mid = Math.max.apply(null, rng(0.42, 0.58)), d1 = Math.min.apply(null, rng(0.18, 0.4)), d2 = Math.min.apply(null, rng(0.6, 0.82));
      best = mid > Math.max(d1, d2) + 0.12 ? '8' : '0';
    }
    return {c: best, s: mejor[best]};
  }
  function numeros(m, letras) {
    letras = letras || '0123456789';
    var hi = pct(m, 0.995), lo = pct(m, 0.4);
    if (hi - lo < 40 || hi < 110) return '';
    var w = m.w, h = m.h, ink = new Uint8Array(w * h), gn = img(w, h), th = Math.max(hi * 0.62, 100), i;
    for (i = 0; i < w * h; i++) { ink[i] = m.a[i] > th ? 1 : 0; gn.a[i] = Math.max(0, Math.min(1, (m.a[i] - lo) / (hi - lo))); }
    var segs = columnas(ink, w, h, 0, h).filter(function (s) { var n = 0; for (var y = 0; y < h; y++) for (var x = s[0]; x < s[1]; x++) n += ink[y * w + x]; return n > 3; });
    if (!segs.length) return '';
    var cajas = segs.map(function (s) { var f = filasDe(ink, w, s[0], s[1], 0, h); return {a: s[0], b: s[1], t: f.t, u: f.u, rows: f.rows}; });
    var H = Math.max.apply(null, cajas.map(function (c) { return c.u - c.t; }));
    var out = '';
    cajas.forEach(function (c) {
      var hh = c.u - c.t, ww = c.b - c.a;
      if (hh < 0.25 * H) return;  // ruido
      var r = c.rows.slice(c.t, c.u), hueco = r[0] && r[r.length - 1] && r.indexOf(false) > 0;
      if (ww < 0.3 * H && (hh < 0.45 * H || hueco)) { out += (hueco || hh > 0.3 * H) ? ':' : '.'; return; }
      if (ww < 0.18 * H && hh > 0.8 * H) { out += '1'; return; }
      var n = Math.max(1, Math.round(ww / (0.56 * H))), cortes = [0];
      for (var k = 1; k < n; k++) {  // glifos pegados: cortar donde hay menos tinta
        var cc = Math.round(ww * k / n), l = Math.max(1, cc - Math.round(0.15 * H)), rr = Math.min(ww - 1, cc + Math.round(0.15 * H)), bx = cc, bv = 1e9;
        for (var x = l; x < rr; x++) { var s = 0; for (var y = c.t; y < c.u; y++) s += ink[y * w + c.a + x]; if (s < bv) { bv = s; bx = x; } }
        cortes.push(bx);
      }
      cortes.push(ww);
      for (k = 0; k < n; k++) {
        var x0 = c.a + cortes[k], x1 = c.a + cortes[k + 1], xa = -1, xb = -1;
        for (var xx = x0; xx < x1; xx++) { var hay = false; for (var yy = c.t; yy < c.u; yy++) if (ink[yy * w + xx]) { hay = true; break; } if (hay) { if (xa < 0) xa = xx; xb = xx + 1; } }
        if (xa < 0) continue;
        out += clasificar(sub(gn, xa, c.t, xb, c.u), letras).c;
      }
    });
    return out;
  }
  // ---------- siglas de los equipos: se elige entre una lista cerrada ----------
  function siglas(m, codigos) {
    var hi = pct(m, 0.995), lo = pct(m, 0.4);
    if (hi - lo < 40) return [];
    var w = m.w, h = m.h, gn = img(w, h), ink = new Uint8Array(w * h), i;
    for (i = 0; i < w * h; i++) { gn.a[i] = Math.max(0, Math.min(1, (m.a[i] - lo) / (hi - lo))); ink[i] = gn.a[i] > 0.5 ? 1 : 0; }
    // la banda de filas con más tinta es la palabra principal (descarta la línea de «LPL #4» de abajo)
    var best = [0, 0, 0], y = 0;
    function fila(y) { for (var x = 0; x < w; x++) if (ink[y * w + x]) return true; return false; }
    while (y < h) { if (fila(y)) { var a = y, n = 0; while (y < h && fila(y)) { for (var x = 0; x < w; x++) n += ink[y * w + x]; y++; } if (n > best[0]) best = [n, a, y]; } else y++; }
    if (!best[0]) return [];
    var segs = columnas(ink, w, h, best[1], best[2]).filter(function (s) { return s[1] - s[0] > 1; });
    if (!segs.length) return [];
    // la palabra: segmentos cercanos entre sí (separa un logo o un ícono a los costados)
    var bh = best[2] - best[1], grupos = [[segs[0]]];
    for (i = 1; i < segs.length; i++) { if (segs[i][0] - segs[i - 1][1] > bh * 0.6) grupos.push([]); grupos[grupos.length - 1].push(segs[i]); }
    var res = [];
    grupos.forEach(function (gr) {
      var a = gr[0][0], b = gr[gr.length - 1][1]; if (b - a < bh * 0.4) return;
      var p = sub(gn, a, best[1], b, best[2]), v = vec(p, TW, TH), asp = p.w / p.h;
      codigos.forEach(function (code) {
        var s = -9; plantillaSiglas(code).forEach(function (t) { s = Math.max(s, dot(v, t.v) - 0.5 * Math.abs(Math.log(asp / t.asp))); });
        res.push({code: code, s: s});
      });
    });
    var top = {}; res.forEach(function (r) { if (top[r.code] == null || r.s > top[r.code]) top[r.code] = r.s; });
    return Object.keys(top).map(function (c) { return {code: c, s: top[c]}; }).sort(function (a, b) { return b.s - a.s; });
  }
  // miniatura para el diagnóstico
  function png(m) {
    var c = document.createElement('canvas'); c.width = m.w; c.height = m.h;
    var x = c.getContext('2d'), d = x.createImageData(m.w, m.h);
    for (var i = 0; i < m.a.length; i++) { var v = Math.max(0, Math.min(255, m.a[i])); d.data[i * 4] = d.data[i * 4 + 1] = d.data[i * 4 + 2] = v; d.data[i * 4 + 3] = 255; }
    x.putImageData(d, 0, 0); return c.toDataURL('image/png');
  }
  window.RiftLector = {recorte: recorte, numeros: numeros, siglas: siglas, png: png, _img: img};
})();

/* RiftPulse — overlay personal de espectador (se inyecta sobre el stream; SOLO lo ve el usuario).
   Barra HORIZONTAL que se acopla al HUD de la transmisión. Aporta lo que el stream no sintetiza:
   probabilidad de victoria, impacto del próximo objetivo y la trayectoria. Módulos con triggers.
   Usa window.RiftEngine (engine.js). Shadow DOM. */
(function () {
  'use strict';
  if (!window.RiftEngine) { console.warn('[RiftPulse] falta engine.js'); return; }
  if (document.getElementById('rp-overlay-host')) return;
  var R = window.RiftEngine;

  function ls(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } }
  var EXT = (function () { try { return JSON.parse(ls('rp_ext6') || '["obj","pg","oro"]'); } catch (e) { return ['obj', 'pg', 'oro']; } })();
  var POS = ls('rp_pos6') || 'top';
  var DMG = ls('rp_dmg6') !== '0';  // reparto de daño automático tras cada pelea
  var XY = (function () { try { return JSON.parse(ls('rp_xy6') || 'null'); } catch (e) { return null; } })();

  if (!document.getElementById('rp-fonts')) { var fl = document.createElement('link'); fl.id = 'rp-fonts'; fl.rel = 'stylesheet';
    fl.href = 'https://fonts.googleapis.com/css2?family=Anton&family=Oswald:wght@400;500;600;700&display=swap'; (document.head || document.documentElement).appendChild(fl); }
  var host = document.createElement('div');
  host.id = 'rp-overlay-host';
  host.style.cssText = 'position:fixed;z-index:2147483646;max-width:96vw;';
  (document.body || document.documentElement).appendChild(host);
  var sh = host.attachShadow({mode: 'open'});
  // el video principal de la página (el más grande que esté visible)
  function mainVideo() {
    var best = null, area = 0;
    document.querySelectorAll('video').forEach(function (v) { var r = v.getBoundingClientRect(), a = r.width * r.height; if (a > area && r.width > 200) { best = v; area = a; } });
    return best;
  }
  // arriba = justo debajo del marcador oficial de la transmisión; abajo = encima del panel de jugadores
  function place() {
    if (XY) { host.style.left = XY.l + 'px'; host.style.top = XY.t + 'px'; host.style.bottom = 'auto'; host.style.transform = 'none'; return; }
    var v = mainVideo(), r = v ? v.getBoundingClientRect() : null;
    host.style.transform = 'translateX(-50%)';
    host.style.left = r ? (r.left + r.width / 2) + 'px' : '50%';
    if (POS === 'bottom') { host.style.top = 'auto'; host.style.bottom = r ? Math.max(8, innerHeight - (r.top + r.height * 0.70)) + 'px' : '112px'; }
    else { host.style.bottom = 'auto'; host.style.top = r ? Math.max(8, r.top + r.height * 0.125) + 'px' : '52px'; }
  }
  setInterval(place, 2000);
  place();

  function rpFullscreen() { var fs = document.fullscreenElement || document.webkitFullscreenElement || null; var dest = fs || document.body; if (dest && host.parentNode !== dest) dest.appendChild(host); }
  document.addEventListener('fullscreenchange', rpFullscreen);
  document.addEventListener('webkitfullscreenchange', rpFullscreen);

  var CSS = '\
  :host{all:initial}*{box-sizing:border-box;font-family:Oswald,"Chakra Petch",system-ui,"Segoe UI",Roboto,sans-serif}\
  .w{position:relative;display:inline-flex;align-items:stretch;height:48px;border-radius:5px;overflow:visible;\
     background:linear-gradient(180deg,rgba(16,30,62,.94),rgba(6,12,28,.96));border:1px solid rgba(150,180,230,.24);\
     box-shadow:0 14px 34px rgba(0,0,0,.6),inset 0 1px 0 rgba(255,255,255,.07);backdrop-filter:blur(8px);color:#eef3fb;cursor:grab}\
  .w::after{content:"";position:absolute;left:-1px;top:-1px;width:70px;height:2px;background:linear-gradient(90deg,#f2c14e,rgba(242,193,78,0));border-radius:5px 0 0 0;pointer-events:none}\
  .w.drag{cursor:grabbing}\
  .seg{display:flex;flex-direction:column;justify-content:center;padding:0 13px;border-right:1px solid rgba(150,180,230,.14);white-space:nowrap}\
  .seg:last-child{border-right:0}\
  .brand{align-items:center;flex-direction:row;gap:8px;background:linear-gradient(90deg,rgba(242,193,78,.1),rgba(242,193,78,0))}.brand .logo{width:20px;height:20px;display:block}\
  .brand .bn{font-size:12px;font-weight:700;letter-spacing:2.4px;text-transform:uppercase;color:#eef3fb}\
  .prob{flex-direction:row;align-items:center;gap:10px}\
  .tc{font-family:Anton,Oswald,sans-serif;font-size:19px;letter-spacing:1px;text-shadow:0 2px 6px rgba(0,0,0,.6)}\
  .tc.b{color:#6fb8ff}.tc.r{color:#ff7a86}\
  .bar{position:relative;width:196px;height:26px;display:flex;clip-path:polygon(8px 0,100% 0,calc(100% - 8px) 100%,0 100%);background:rgba(255,255,255,.06)}\
  .pb{display:flex;align-items:center;padding:0 12px;color:#04101f;font-weight:700;font-size:14px;letter-spacing:.4px;font-variant-numeric:tabular-nums;background:linear-gradient(180deg,#7cc4ff,#2f7fe0);transition:width .8s cubic-bezier(.4,0,.2,1)}\
  .pr{display:flex;align-items:center;justify-content:flex-end;padding:0 12px;color:#fff;font-weight:700;font-size:14px;letter-spacing:.4px;font-variant-numeric:tabular-nums;background:linear-gradient(180deg,#ff7684,#c93a52);transition:width .8s cubic-bezier(.4,0,.2,1)}\
  .pb.lead{background:linear-gradient(180deg,#a3d6ff,#4aa3ff 45%,#2f7fe0);box-shadow:inset 0 0 14px rgba(255,255,255,.35)}\
  .pr.lead{background:linear-gradient(180deg,#ffa0aa,#ff4d5e 45%,#c93a52);box-shadow:inset 0 0 14px rgba(255,255,255,.3)}\
  .sl{font-size:9px;letter-spacing:1.6px;text-transform:uppercase;color:#8fa0c2;line-height:1.3}\
  .sv{font-size:14px;font-weight:700;font-variant-numeric:tabular-nums;line-height:1.25;color:#eef3fb;letter-spacing:.4px}\
  .sv b{font-weight:700}.sv b.b{color:#6fb8ff}.sv b.r{color:#ff7a86}.sv .mut{color:#8fa0c2;font-weight:400;font-size:11px}\
  .obj .sv2{font-size:11px;color:#8fa0c2}\
  .spark{display:flex;align-items:center;gap:8px}\
  .spark svg{display:block;width:96px;height:30px}\
  .acc{align-items:center;background:linear-gradient(270deg,rgba(61,220,151,.08),rgba(61,220,151,0))}.acc .n{font-size:16px;font-weight:700;color:#3ddc97;font-variant-numeric:tabular-nums}.acc .l{font-size:8.5px;letter-spacing:1.6px;text-transform:uppercase;color:#8fa0c2}\
  .next{flex-direction:row;align-items:center;gap:8px;font-weight:700}\
  .next .vs{font-family:Anton,Oswald,sans-serif;font-weight:400;font-size:16px;letter-spacing:1px}.next .vs .b{color:#6fb8ff}.next .vs .r{color:#ff7a86}\
  .next .in{font-size:11px;color:#8fa0c2;font-weight:400;letter-spacing:.6px}\
  .wait{display:flex;align-items:center;padding:0 14px;font-size:12px;letter-spacing:1px;text-transform:uppercase;color:#8fa0c2}\
  /* controles al pasar el mouse */\
  .ctl{position:absolute;left:50%;transform:translateX(-50%);top:calc(100% + 6px);display:none;gap:4px;align-items:center;\
     background:rgba(6,12,28,.96);border:1px solid rgba(150,180,230,.24);border-radius:4px;padding:4px 6px;box-shadow:0 8px 20px rgba(0,0,0,.5)}\
  .w:hover .ctl{display:flex}\
  .chip{font-size:10px;font-weight:600;letter-spacing:1.2px;text-transform:uppercase;color:#8fa0c2;background:rgba(13,24,48,.8);border:1px solid rgba(150,180,230,.24);border-radius:3px;padding:2px 8px;cursor:pointer;white-space:nowrap}\
  .chip.on{color:#06121f;background:linear-gradient(180deg,#4aa3ff,#2f7fe0);border-color:#4aa3ff}.chip:hover{color:#e8edf7}\
  .chip.on:hover{color:#06121f}\
  .ctl button.ic{width:18px;height:18px;border:1px solid rgba(120,150,200,.35);border-radius:5px;background:transparent;color:#8b97b0;font-size:11px;line-height:1;cursor:pointer;padding:0}\
  .ctl button.ic:hover{color:#fff;border-color:#4aa3ff}\
  .mom{position:absolute;left:50%;top:-22px;transform:translateX(-50%);display:none;align-items:center;gap:6px;background:rgba(6,12,28,.96);border:1px solid rgba(242,193,78,.6);border-radius:3px;padding:2px 10px;font-size:11px;font-weight:600;letter-spacing:1.2px;text-transform:uppercase;color:#f6e7c1;white-space:nowrap;box-shadow:0 6px 18px rgba(0,0,0,.5);z-index:3}\
  .mom.show{display:flex}.mom .zap{color:#f2c14e}.mom .k.b{color:#7cc0ff}.mom .k.r{color:#ff8a8f}\
  .cards{position:absolute;left:50%;top:calc(100% + 8px);transform:translateX(-50%);display:flex;flex-wrap:wrap;justify-content:center;gap:8px;width:max-content;max-width:94vw;z-index:2;pointer-events:none}\
  .cards.up{top:auto;bottom:calc(100% + 8px);flex-wrap:wrap-reverse}\
  .w:hover .cards:not(.up){top:calc(100% + 42px)}\
  .cd{width:300px;background:linear-gradient(180deg,rgba(16,30,62,.95),rgba(6,12,28,.96));border:1px solid rgba(150,180,230,.24);border-radius:5px;padding:9px 12px 10px;box-shadow:0 12px 30px rgba(0,0,0,.55);position:relative}\
  .cd::after{content:"";position:absolute;left:-1px;top:-1px;width:50px;height:2px;background:linear-gradient(90deg,#f2c14e,rgba(242,193,78,0))}\
  .ch{display:flex;justify-content:space-between;align-items:baseline;font-size:11px;letter-spacing:1.8px;text-transform:uppercase;color:#c8d3ea;margin-bottom:6px}.ch b{font-size:14px;letter-spacing:.5px;font-variant-numeric:tabular-nums}\
  .ch b.b,.cd .b{color:#6fb8ff}.ch b.r,.cd .r{color:#ff7a86}.cd .mut{color:#8fa0c2}\
  .cd svg{display:block;width:100%;height:84px}\
  .lg{display:flex;gap:10px;font-size:10.5px;color:#8fa0c2;margin-top:4px;letter-spacing:.4px}\
  .du{display:grid;grid-template-columns:1fr 34px 1fr;align-items:center;gap:6px;font-size:12.5px;padding:3px 0;border-top:1px solid rgba(150,180,230,.1)}.du:first-of-type{border-top:0}\
  .du .rl{text-align:center;font-size:10px;color:#8fa0c2;letter-spacing:1px;text-transform:uppercase}.du .nb{display:flex;gap:6px;align-items:center;min-width:0}.du .nr{justify-content:flex-end}\
  .du .nm{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.du .gd{font-size:11px;font-variant-numeric:tabular-nums;font-weight:700;flex:none}\
  .ir{display:flex;justify-content:space-between;align-items:center;font-size:13px;padding:4px 0}.ir .big{font-family:Anton,Oswald,sans-serif;font-size:22px;letter-spacing:.5px}\
  .in{font-size:12px;color:#c8d3ea;line-height:1.45;margin-top:4px;border-top:1px solid rgba(150,180,230,.12);padding-top:6px}\
  .dmg{display:none;width:470px;max-width:92vw;pointer-events:auto;\
     background:linear-gradient(180deg,rgba(16,30,62,.96),rgba(6,12,28,.97));border:1px solid rgba(150,180,230,.24);border-radius:5px;padding:10px 13px;box-shadow:0 12px 32px rgba(0,0,0,.6);z-index:4}\
  .dmg.show{display:block;position:relative}\
  .dh{font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#f2c14e;margin-bottom:7px;display:flex;justify-content:space-between}.dh .wl{color:#cdd7ea;font-weight:700}\
  .dcols{display:grid;grid-template-columns:1fr 1fr;gap:3px 16px}\
  .drow{display:flex;align-items:center;gap:7px;padding:1px 0}\
  .dn{font-size:12px;font-weight:600;letter-spacing:.6px;width:64px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;flex:none}\
  .dbar{flex:1;height:7px;border-radius:1px;background:rgba(120,150,200,.14);overflow:hidden}.dbar>div{height:7px;border-radius:4px}\
  .dcol.b .dbar>div{background:linear-gradient(90deg,#2f7fe0,#4aa3ff)}.dcol.r .dbar>div{background:linear-gradient(90deg,#c3506a,#ff5a5f)}\
  .dcol.b .dn{color:#7cc0ff}.dcol.r .dn{color:#ff8a8f}\
  .dp{font-size:10.5px;font-variant-numeric:tabular-nums;color:#aeb9cf;width:30px;text-align:right;flex:none}\
  .syncg{display:flex;align-items:center;gap:3px;font-size:9.5px;color:#8b97b0;border-left:1px solid rgba(120,150,200,.25);padding-left:6px;margin-left:2px}\
  .syncg input{width:42px;height:18px;background:rgba(20,28,44,.7);border:1px solid rgba(120,150,200,.3);border-radius:5px;color:#e8edf7;font:inherit;font-size:11px;text-align:center;padding:0 3px}\
  .syncg input:focus{outline:none;border-color:#4aa3ff}.syncg input.bad{border-color:#ff5a5f}\
  .ast{font-size:9.5px;letter-spacing:1px;color:#8fa0c2;max-width:190px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;padding-right:4px}\
  .ast.ok{color:#3ddc97}\
  .diag{position:absolute;right:0;top:calc(100% + 40px);display:none;width:340px;background:rgba(6,12,28,.97);border:1px solid rgba(242,193,78,.45);border-radius:5px;padding:10px 12px;box-shadow:0 12px 32px rgba(0,0,0,.6);z-index:5;cursor:default}\
  .diag.show{display:block}.dg-t{font-size:11px;letter-spacing:1.6px;text-transform:uppercase;color:#f2c14e;margin-bottom:6px}\
  .dg-r{display:flex;justify-content:space-between;gap:10px;font-size:12px;padding:2px 0;border-bottom:1px solid rgba(150,180,230,.1)}.dg-r span{color:#8fa0c2;flex:none}.dg-r b{color:#eef3fb;font-weight:500;text-align:right;font-family:Inter,system-ui,sans-serif}\
  .dg-i{display:block;max-width:100%;height:34px;margin:4px 0;border:1px solid rgba(150,180,230,.2);image-rendering:pixelated}.dg-n{font-size:11px;color:#8fa0c2;margin-top:6px}\
  .syncg .gt{font-variant-numeric:tabular-nums;color:#aab6cc;font-weight:700}\
  ';

  var LOGO = '<svg class="logo" viewBox="0 0 64 64" aria-hidden="true"><defs><linearGradient id="rplg" x1="8" y1="40" x2="56" y2="26" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#4aa3ff"/><stop offset=".5" stop-color="#9ab0e6"/><stop offset="1" stop-color="#ff5a5f"/></linearGradient></defs><rect x="4" y="4" width="56" height="56" rx="15" fill="#0d1320" stroke="#2b3c62" stroke-width="3"/><path d="M10 35 H21 L25 35 L30 17 L36 49 L40 35 H54" fill="none" stroke="url(#rplg)" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  sh.innerHTML = '<style>' + CSS + '</style><div class="w" id="w"><div class="mom" id="mom"></div><div class="diag" id="diag"></div><div class="cards" id="cards"><div class="dmg" id="dmg"></div><div id="cardsx" style="display:contents"></div></div><div id="body" style="display:inline-flex"></div>' +
    '<div class="ctl" id="ctl"><span class="chip" id="autoc" title="Lee el reloj y el marcador del video y se sincroniza solo">auto-sync</span><span class="ast" id="ast"></span><button class="ic" id="diagb" title="diagnóstico del auto-sync: qué está leyendo del video">?</button><span class="chip" data-ext="obj">objetivo</span><span class="chip" data-ext="pg">trayectoria</span><span class="chip" data-ext="oro">oro</span><span class="chip" data-ext="dano">daño</span><span class="chip" data-ext="imp">impacto</span><span class="chip" data-ext="duelos">duelos</span>' +
    '<button class="ic" id="posbtn" title="arriba/abajo">↑↓</button><button class="ic" data-d="-5" title="atrasar">−</button><button class="ic" data-d="5" title="adelantar">+</button>' +
    '<span class="syncg" title="Escribe el minuto que ves en el stream y pulsa ⟲ (o Enter) para clavar el overlay a ese momento">ves <input id="scm" placeholder="mm:ss" maxlength="5"><button class="ic" id="syncb" title="sincronizar al minuto que ves">⟲</button> va <span class="gt" id="gtnow">—</span></span></div></div>';
  var wEl = sh.getElementById('w'), body = sh.getElementById('body'), ctl = sh.getElementById('ctl'), momEl = sh.getElementById('mom'), dmgEl = sh.getElementById('dmg'), cardsEl = sh.getElementById('cards'), cardsX = sh.getElementById('cardsx');

  function syncChips() { ctl.querySelectorAll('.chip[data-ext]').forEach(function (c) { c.classList.toggle('on', EXT.indexOf(c.getAttribute('data-ext')) >= 0); }); }
  syncChips();
  var LAST = null;
  ctl.querySelectorAll('.chip[data-ext]').forEach(function (c) { c.addEventListener('mousedown', function (e) { e.stopPropagation(); }); c.addEventListener('click', function (e) { e.stopPropagation(); var k = c.getAttribute('data-ext'), i = EXT.indexOf(k); if (i >= 0) EXT.splice(i, 1); else EXT.push(k); ls('rp_ext6', JSON.stringify(EXT)); syncChips(); if (LAST) render(LAST); }); });
  sh.getElementById('posbtn').addEventListener('click', function (e) { e.stopPropagation(); POS = POS === 'top' ? 'bottom' : 'top'; XY = null; ls('rp_xy6', 'null'); ls('rp_pos6', POS); place(); });
  ctl.querySelectorAll('button[data-d]').forEach(function (b) { b.addEventListener('mousedown', function (e) { e.stopPropagation(); }); b.addEventListener('click', function (e) { e.stopPropagation(); R.nudge(+b.getAttribute('data-d')); }); });
  var scmEl = sh.getElementById('scm'), gtnowEl = sh.getElementById('gtnow');
  function doSync() {
    var m = (scmEl.value || '').trim().match(/^(\d{1,2})(?::([0-5]?\d))?$/);
    var ok = !!m && R.syncTo(+m[1] * 60 + (+m[2] || 0));
    scmEl.classList.toggle('bad', !ok); if (ok) { scmEl.value = ''; scmEl.blur(); }
  }
  sh.getElementById('syncb').addEventListener('mousedown', function (e) { e.stopPropagation(); });
  sh.getElementById('syncb').addEventListener('click', function (e) { e.stopPropagation(); doSync(); });
  scmEl.addEventListener('mousedown', function (e) { e.stopPropagation(); });
  scmEl.addEventListener('keydown', function (e) { e.stopPropagation(); if (e.key === 'Enter') doSync(); });
  scmEl.addEventListener('input', function () { scmEl.classList.remove('bad'); });

  (function () { var sx, sy, ox, oy, on = false;
    wEl.addEventListener('mousedown', function (e) { if (e.target.closest('.ctl')) return; on = true; wEl.classList.add('drag'); var r = host.getBoundingClientRect(); sx = e.clientX; sy = e.clientY; ox = r.left; oy = r.top; e.preventDefault(); });
    window.addEventListener('mousemove', function (e) { if (!on) return; var l = Math.max(0, Math.min(innerWidth - 80, ox + e.clientX - sx)), t = Math.max(0, Math.min(innerHeight - 24, oy + e.clientY - sy)); host.style.left = l + 'px'; host.style.top = t + 'px'; host.style.bottom = 'auto'; host.style.transform = 'none'; });
    window.addEventListener('mouseup', function () { if (!on) return; on = false; wEl.classList.remove('drag'); var r = host.getBoundingClientRect(); XY = {l: Math.round(r.left), t: Math.round(r.top)}; ls('rp_xy6', JSON.stringify(XY)); });
  })();

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return {'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]; }); }
  function mmss(x) { x = Math.max(0, Math.round(x)); return Math.floor(x / 60) + ':' + String(x % 60).padStart(2, '0'); }
  function miniSpark(sm) {
    if (!sm || sm.length < 2) return '<svg viewBox="0 0 96 30"></svg>';
    var W = 96, H = 30, t0 = sm[0].gt, t1 = sm[sm.length - 1].gt, span = Math.max(1, t1 - t0);
    var xy = sm.map(function (s) { var v = Math.max(0, Math.min(1, s.p)); return [(s.gt - t0) / span * W, H - 2 - v * (H - 4)]; });
    var line = 'M' + xy.map(function (a) { return a[0].toFixed(1) + ' ' + a[1].toFixed(1); }).join(' L');
    var area = line + ' L' + W + ' ' + H + ' L0 ' + H + ' Z', mid = H / 2;
    return '<svg viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="none"><defs><linearGradient id="z" x1="0" y1="0" x2="0" y2="' + H + '" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#4aa3ff" stop-opacity=".4"/><stop offset=".5" stop-color="#4aa3ff" stop-opacity=".05"/><stop offset=".5" stop-color="#ff5a5f" stop-opacity=".05"/><stop offset="1" stop-color="#ff5a5f" stop-opacity=".4"/></linearGradient></defs><line x1="0" y1="' + mid + '" x2="' + W + '" y2="' + mid + '" stroke="#38415c" stroke-width="1" stroke-dasharray="3 3"/><path d="' + area + '" fill="url(#z)"/><path d="' + line + '" fill="none" stroke="#dbe6fb" stroke-width="1.6" stroke-linejoin="round"/></svg>';
  }

  var hist = [], lastMom = 0, lastFightGt = -1, fightTimer = null;
  function showFight(s) {
    if (!DMG) return;
    var f = s.game && s.game.fight;
    if (!f || f.gt == null || !(f.blue || f.red)) return;
    if (f.gt === lastFightGt) return;  // ya mostrada
    lastFightGt = f.gt;
    var m = s.match;
    function col(side, cls) {
      side = side || []; var mx = side.reduce(function (a, p) { return Math.max(a, p.share); }, 0.01);
      return '<div class="dcol ' + cls + '">' + side.map(function (p) { return '<div class="drow"><span class="dn">' + esc(p.name) + '</span><div class="dbar"><div style="width:' + Math.round(p.share / mx * 100) + '%"></div></div><span class="dp">' + Math.round(p.share * 100) + '%</span></div>'; }).join('') + '</div>';
    }
    dmgEl.innerHTML = '<div class="dh"><span>Reparto de daño · tras la pelea</span><span class="wl">' + esc(f.win === 'blue' ? m.blue.code : m.red.code) + ' ganó el cambio</span></div><div class="dcols">' + col(f.blue, 'b') + col(f.red, 'r') + '</div>';
    dmgEl.classList.add('show');
    clearTimeout(fightTimer); fightTimer = setTimeout(function () { dmgEl.classList.remove('show'); }, 8500);
  }
  function render(s) { render0(s); tarjetas(body.querySelector('.wait') ? null : s); }
  function render0(s) {
    LAST = s;
    gtnowEl.textContent = s.game && s.game.pBlue != null ? mmss(s.game.gt) : '—';
    // con el auto-sync activo nunca se muestra otro partido: mientras reconoce el del video, lo dice
    var leyendo = typeof AS !== 'undefined' && AS.on && Date.now() - AS.visto < 20000;
    if (leyendo && (!AS.id || !s.match || s.match.id !== AS.id.matchId)) {
      body.innerHTML = '<div class="seg brand">' + LOGO + '<span class="bn">RiftPulse</span></div><div class="wait">' + (AS.id ? 'Cargando ' + esc(AS.id.codes.join(' vs ')) + ' · juego ' + AS.id.juego + '…' : 'Sincronizando con el video…') + '</div>';
      return;
    }
    if (!s.match) {
      if (s.next) { body.innerHTML = '<div class="seg brand">' + LOGO + '<span class="bn">RiftPulse</span></div>' +
        '<div class="seg next"><span class="sl">Próximo partido</span><span class="vs"><span class="b">' + esc(s.next.blue) + '</span> vs <span class="r">' + esc(s.next.red) + '</span></span></div>'; }
      else body.innerHTML = '<div class="seg brand">' + LOGO + '<span class="bn">RiftPulse</span></div><div class="wait">buscando partido del Mundial…</div>';
      return;
    }
    var m = s.match, g = s.game;
    var html = '<div class="seg brand">' + LOGO + '<span class="bn">RiftPulse</span></div>';

    if (!g || g.pBlue == null) {
      html += '<div class="seg prob"><span class="tc b">' + esc(m.blue.code) + '</span><span class="sl" style="padding:0 4px">' + ((g && g.waiting) ? 'cargando juego…' : 'por empezar') + '</span><span class="tc r">' + esc(m.red.code) + '</span></div>';
      if (s.next) html += '<div class="seg next"><span class="sl">Próximo</span><span class="vs"><span class="b">' + esc(s.next.blue) + '</span> vs <span class="r">' + esc(s.next.red) + '</span></span></div>';
      body.innerHTML = html; return;
    }

    var pb = Math.round(g.pBlue * 100), pr = 100 - pb, lb = pb >= pr ? ' lead' : '', lr = pr > pb ? ' lead' : '';
    html += '<div class="seg prob"><span class="tc b">' + esc(m.blue.code) + '</span>' +
      '<div class="bar"><div class="pb' + lb + '" style="width:' + Math.min(85, Math.max(pb, 15)) + '%">' + pb + '%</div><div class="pr' + lr + '" style="width:' + Math.min(85, Math.max(pr, 15)) + '%">' + pr + '%</div></div>' +
      '<span class="tc r">' + esc(m.red.code) + '</span></div>';

    if (EXT.indexOf('obj') >= 0 && g.impact) {
      var im = g.impact, ib = Math.max(0, im.blue), ir = Math.max(0, im.red), bigB = ib >= ir;
      html += '<div class="seg obj"><span class="sl">Próx. ' + esc(im.obj) + ' · ' + mmss(Math.max(0, im.at - g.gt)) + '</span>' +
        '<span class="sv"><b class="' + (bigB ? 'b' : 'r') + '">' + esc(bigB ? m.blue.code : m.red.code) + ' +' + Math.max(ib, ir) + '</b> <span class="mut">' + esc(bigB ? m.red.code : m.blue.code) + ' +' + Math.min(ib, ir) + '</span></span></div>';
    }
    if (EXT.indexOf('pg') >= 0) {
      html += '<div class="seg spark">' + miniSpark(g.samples || []) + '<div style="display:flex;flex-direction:column"><span class="sl">trayectoria</span><span class="sv">' + esc(pb >= pr ? m.blue.code : m.red.code) + ' ' + Math.max(pb, pr) + '%</span></div></div>';
    }
    html += '<div class="seg acc"><span class="n">' + (s.precision ? Math.round(s.precision.acc15 * 100) + '%' : '—') + '</span><span class="l">acierto</span></div>';

    body.innerHTML = html;
    hist.push({t: Date.now(), p: g.pBlue}); checkMomentum(s); showFight(s);
  }

  // ---------- paneles para el espectador: oro, daño, impacto y duelos (se eligen con los chips o desde Mando) ----------
  var kc = function (g) { return (Math.abs(g) / 1000).toFixed(1).replace('.', ',') + 'k'; };
  function grafOro(s) {
    var g = s.game, m = s.match, sm = (g.samples || []).filter(function (x) { return x.diff != null; });
    if (sm.length < 2) return '';
    var W = 300, H = 84, t0 = sm[0].gt, span = Math.max(60, sm[sm.length - 1].gt - t0), mx = Math.max(1500, Math.max.apply(null, sm.map(function (x) { return Math.abs(x.diff); }))) * 1.1;
    var X = function (t) { return (t - t0) / span * W; }, Y = function (d) { return H / 2 - d / mx * (H / 2 - 4); };
    var line = sm.map(function (x, i) { return (i ? 'L' : 'M') + X(x.gt).toFixed(1) + ' ' + Y(x.diff).toFixed(1); }).join(' ');
    var area = line + ' L' + X(sm[sm.length - 1].gt).toFixed(1) + ' ' + H / 2 + ' L0 ' + H / 2 + ' Z';
    var marcas = (g.events || []).filter(function (e) { return ['dragon', 'baron', 'elder', 'inhib'].indexOf(e.kind) >= 0 && e.gt >= t0; }).map(function (e) {
      var c = e.side === 'blue' ? '#6fb8ff' : '#ff7a86', L = {dragon: 'D', baron: 'B', elder: 'A', inhib: 'I'}[e.kind];
      return '<g><circle cx="' + X(e.gt).toFixed(1) + '" cy="' + (e.side === 'blue' ? 9 : H - 9) + '" r="7" fill="#0b1630" stroke="' + c + '"/><text x="' + X(e.gt).toFixed(1) + '" y="' + (e.side === 'blue' ? 12.5 : H - 5.5) + '" fill="' + c + '" font-size="9" font-weight="700" text-anchor="middle">' + L + '</text></g>';
    }).join('');
    var d = sm[sm.length - 1].diff, lado = d >= 0 ? 'b' : 'r';
    return '<div class="cd"><div class="ch"><span>Diferencia de oro</span><b class="' + lado + '">' + esc(d >= 0 ? m.blue.code : m.red.code) + ' +' + kc(d) + '</b></div>' +
      '<svg viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="none"><defs><linearGradient id="og" x1="0" y1="0" x2="0" y2="' + H + '" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#4aa3ff" stop-opacity=".55"/><stop offset=".5" stop-color="#4aa3ff" stop-opacity=".05"/><stop offset=".5" stop-color="#ff4d5e" stop-opacity=".05"/><stop offset="1" stop-color="#ff4d5e" stop-opacity=".55"/></linearGradient></defs>' +
      '<line x1="0" y1="' + H / 2 + '" x2="' + W + '" y2="' + H / 2 + '" stroke="#38415c" stroke-dasharray="3 3"/><path d="' + area + '" fill="url(#og)"/><path d="' + line + '" fill="none" stroke="#e6eefc" stroke-width="1.6" vector-effect="non-scaling-stroke"/>' + marcas + '</svg>' +
      '<div class="lg"><span>' + mmss(t0) + '</span><span style="margin-left:auto">D dragón · B Barón · A ancestral · I inhibidor</span><span>' + mmss(g.gt) + '</span></div></div>';
  }
  function grafDano(s) {
    var L = s.game.lanes; if (!L || !L.length) return '';
    var all = []; L.forEach(function (l) { all.push(l.blue, l.red); });
    var mx = Math.max(0.01, Math.max.apply(null, all.map(function (p) { return p.share || 0; })));
    var col = function (side, cls) { return '<div class="dcol ' + cls + '">' + L.map(function (l) { var p = l[side]; return '<div class="drow"><span class="dn">' + esc(p.name) + '</span><div class="dbar"><div style="width:' + Math.round((p.share || 0) / mx * 100) + '%"></div></div><span class="dp">' + Math.round((p.share || 0) * 100) + '%</span></div>'; }).join('') + '</div>'; };
    return '<div class="cd" style="width:420px"><div class="ch"><span>Daño a campeones · todo el juego</span><span class="mut" style="letter-spacing:.5px;text-transform:none">% de su equipo</span></div><div class="dcols">' + col('blue', 'b') + col('red', 'r') + '</div></div>';
  }
  function grafImpacto(s) {
    var g = s.game, m = s.match, im = g.impact, c = g.comeback; if (!im && !c) return '';
    var h = '<div class="cd"><div class="ch"><span>Impacto' + (im ? ' · próx. ' + esc(im.obj) : '') + '</span>' + (im ? '<span class="mut">en ' + mmss(Math.max(0, im.at - g.gt)) + '</span>' : '') + '</div>';
    if (im) h += '<div class="ir"><span>Si lo toma <b class="b">' + esc(m.blue.code) + '</b></span><span class="big b">' + (im.blue >= 0 ? '+' : '') + im.blue + '</span></div><div class="ir"><span>Si lo toma <b class="r">' + esc(m.red.code) + '</b></span><span class="big r">' + (im.red >= 0 ? '+' : '') + im.red + '</span></div>';
    if (c && c.paths && c.paths[0]) h += '<div class="in"><b class="' + (c.side === 'blue' ? 'b' : 'r') + '">' + esc(c.code) + '</b> (' + Math.round(c.p * 100) + '%) ' + (c.reached ? 'remonta con' : 'se acerca con') + ' <b>' + esc(c.paths[0].txt) + '</b> → ' + Math.round(c.paths[0].p * 100) + '%</div>';
    return h + '</div>';
  }
  function grafDuelos(s) {
    var L = s.game.lanes; if (!L || !L.length) return '';
    return '<div class="cd"><div class="ch"><span>Duelos por línea</span><span class="mut" style="letter-spacing:.5px;text-transform:none">oro de diferencia</span></div>' + L.map(function (l) {
      var gb = l.gd >= 0;
      return '<div class="du"><span class="nb"><span class="nm b">' + esc(l.blue.name) + '</span>' + (gb && l.gd > 99 ? '<span class="gd b">+' + kc(l.gd) + '</span>' : '') + '</span><span class="rl">' + esc(l.label) + '</span><span class="nb nr">' + (!gb && l.gd < -99 ? '<span class="gd r">+' + kc(l.gd) + '</span>' : '') + '<span class="nm r">' + esc(l.red.name) + '</span></span></div>';
    }).join('') + '</div>';
  }
  var cardsSig = '';
  function tarjetas(s) {
    cardsEl.classList.toggle('up', POS === 'bottom' && !XY);
    var h = '';
    if (s && s.game && s.game.pBlue != null) {
      if (EXT.indexOf('oro') >= 0) h += grafOro(s);
      if (EXT.indexOf('imp') >= 0) h += grafImpacto(s);
      if (EXT.indexOf('duelos') >= 0) h += grafDuelos(s);
      if (EXT.indexOf('dano') >= 0) h += grafDano(s);
    }
    if (h !== cardsSig) { cardsSig = h; cardsX.innerHTML = h; }
  }

  function checkMomentum(s) {
    var now = Date.now(); hist = hist.filter(function (x) { return now - x.t <= 90000; });
    if (now - lastMom < 15000) return;
    var past = null; for (var i = 0; i < hist.length; i++) { if (now - hist[i].t >= 34000) past = hist[i]; }
    if (!past) return;
    var d = Math.round((s.game.pBlue - past.p) * 100); if (Math.abs(d) < 11) return;
    var toB = d > 0, code = toB ? s.match.blue.code : s.match.red.code;
    var ev = (s.game.events || []).filter(function (e) { return ['baron', 'elder', 'dragon', 'inhib'].indexOf(e.kind) >= 0 && s.game.gt - e.gt <= 60; }).slice(-1)[0];
    lastMom = now;
    momEl.innerHTML = '<span class="zap">⚡</span><span class="k ' + (toB ? 'b' : 'r') + '">' + esc(code) + ' +' + Math.abs(d) + '</span>' + (ev ? '<span>· ' + esc(ev.txt) + '</span>' : '<span>de momentum</span>');
    momEl.classList.add('show'); setTimeout(function () { momEl.classList.remove('show'); }, 6500);
  }

  // ---------- órdenes del centro de mando (pestaña «Mando» del panel lateral de la extensión) ----------
  function applyCmd(c, inicial) {
    if (!c) return;
    if (c.ext) { EXT = c.ext.slice(); ls('rp_ext6', JSON.stringify(EXT)); syncChips(); }
    if (c.pos) { POS = c.pos; XY = null; ls('rp_xy6', 'null'); ls('rp_pos6', POS); place(); }
    if (c.dmg != null) { DMG = !!c.dmg; ls('rp_dmg6', DMG ? '1' : '0'); if (!DMG) dmgEl.classList.remove('show'); }
    if (c.hidden != null) host.style.display = c.hidden ? 'none' : '';
    if (!inicial && c.sync) R.syncTo(c.sync.secs + (Date.now() - c.sync.at) / 1000);  // las órdenes de un solo uso no se repiten al recargar
    if (!inicial && c.nudge) R.nudge(c.nudge);
    if (LAST) render(LAST);
  }
  var hayStorage = false;
  try { hayStorage = !!(chrome.storage && chrome.storage.local); } catch (e) {}
  if (hayStorage) {
    chrome.storage.local.get('rp_cmd', function (o) { applyCmd(o && o.rp_cmd, true); });
    chrome.storage.onChanged.addListener(function (ch, area) { if (area === 'local' && ch.rp_cmd) applyCmd(ch.rp_cmd.newValue, false); });
  } else {
    // cargado desde la web como «script de usuario»: no ve el almacenamiento, se lo pide al proceso de fondo
    var ultimaN = null;
    var pedir = function (inicial) {
      try { chrome.runtime.sendMessage({type: 'rp-cmd-get'}, function (o) {
        var c = o && o.rp_cmd; if (!c || c.n === ultimaN) return;
        ultimaN = c.n; applyCmd(c, inicial);
      }); } catch (e) {}
    };
    pedir(true); setInterval(function () { pedir(false); }, 1500);
  }

  // ---------- sincronía automática: lee del video el reloj del juego, los equipos y el marcador ----------
  // Sirve en vivo o en repetición, a cualquier hora: el minuto se ata a la posición del video (pausa, velocidad,
  // saltos y cortes de carga incluidos). El lector (lector.js) no usa librerías ni servicios externos.
  var L = window.RiftLector;
  // HUD de la transmisión del Mundial 2026, relativo al cuadro del video
  var HUD = {
    reloj: [0.455, 0.062, 0.545, 0.112],
    tagI: [0.29, 0.0, 0.375, 0.055], tagD: [0.625, 0.0, 0.715, 0.055],
    oroI: [0.415, 0.012, 0.458, 0.058], oroD: [0.548, 0.012, 0.59, 0.058],
    killI: [0.468, 0.01, 0.497, 0.065], killD: [0.503, 0.01, 0.533, 0.065],
    camI: [0.372, 0.393], camD: [0.607, 0.628], camY: [0.761, 0.81, 0.859, 0.907, 0.953], camH: 0.042
  };
  // si el reloj no está ahí (otra transmisión u otro HUD), se busca en estas otras franjas
  var RELOJES = [HUD.reloj, [0.45, 0.0, 0.55, 0.05], [0.44, 0.025, 0.56, 0.085], [0.44, 0.085, 0.56, 0.15], [0.45, 0.9, 0.55, 0.97], [0.0, 0.0, 0.12, 0.07], [0.88, 0.0, 1.0, 0.07]];
  var AS = {on: ls('rp_auto6') !== '0', busy: false, zona: null, fallas: 0, lect: [], off: null, id: null, visto: 0, codes: null, codesAt: 0, n: 0, diag: {}, err: ''};
  function parseReloj(s) {
    s = String(s || '').replace(/[^\d:]/g, '');
    var m = s.match(/(\d{1,2}):(\d{2})$/) || s.match(/^(\d{1,2})(\d{2})$/);
    if (!m || +m[2] > 59 || +m[1] > 75) return null;
    return +m[1] * 60 + +m[2];
  }
  function oro(s) {  // «3.1K», «31K» o «3.1» -> 3.1 (miles)
    s = String(s || '').replace(/[^\d.]/g, ''); if (!s) return null;
    if (s.indexOf('.') < 0 && s.length >= 2) s = s.slice(0, -1) + '.' + s.slice(-1);
    var v = parseFloat(s); return v > 0 && v < 150 ? v : null;
  }
  var autoc = sh.getElementById('autoc'), astEl = sh.getElementById('ast'), diagEl = sh.getElementById('diag');
  function asEstado(t, ok) { astEl.textContent = t; astEl.classList.toggle('ok', !!ok); AS.diag.estado = t; }
  function asChip() { autoc.classList.toggle('on', AS.on); if (!AS.on) asEstado(''); }
  asChip();
  autoc.addEventListener('mousedown', function (e) { e.stopPropagation(); });
  autoc.addEventListener('click', function (e) { e.stopPropagation(); AS.on = !AS.on; ls('rp_auto6', AS.on ? '1' : '0'); AS.id = null; AS.off = null; AS.lect = []; asChip(); if (!AS.on) R.follow(null); if (LAST) render(LAST); });
  sh.getElementById('diagb').addEventListener('mousedown', function (e) { e.stopPropagation(); });
  sh.getElementById('diagb').addEventListener('click', function (e) { e.stopPropagation(); diagEl.classList.toggle('show'); pintarDiag(); });
  // lo que se ve en pantalla, para el centro de mando del panel
  function publicar() {
    var d = AS.id ? {matchId: AS.id.matchId, juego: AS.id.juego, gameId: AS.id.gameId, codes: AS.id.codes, gt: AS.off != null ? AS.off + (mainVideo() || {}).currentTime : null, playing: !(mainVideo() || {}).paused, at: Date.now()} : null;
    try { if (chrome.storage && chrome.storage.local) chrome.storage.local.set({rp_pantalla: d}); else chrome.runtime.sendMessage({type: 'rp-pantalla', data: d}, function () { void chrome.runtime.lastError; }); } catch (e) {}
  }
  // atar el motor al video: minuto = desfase + posición del video
  function seguir(v) {
    if (!AS.id || AS.off == null || !v) return;
    var gt = Math.max(0, AS.off + v.currentTime), g = LAST && LAST.game, playing = !v.paused && !v.ended && v.readyState > 2;
    var esp = g && g.gt != null && LAST.match && LAST.match.id === AS.id.matchId ? g.gt : null;
    if (esp == null || Math.abs(esp - gt) > 1.5 || AS.playing !== playing || AS.speed !== v.playbackRate) {
      AS.playing = playing; AS.speed = v.playbackRate;
      R.follow({matchId: AS.id.matchId, juego: AS.id.juego, gt: gt, playing: playing, speed: v.playbackRate || 1, at: Date.now()});
    }
  }
  async function codigos() {
    if (AS.codes && Date.now() - AS.codesAt < 600000) return AS.codes;
    var ms = await R.loadMatches(), set = {};
    (ms || []).forEach(function (x) { x.teams.forEach(function (t) { if (t.code) set[t.code] = 1; }); });
    AS.codes = Object.keys(set); AS.codesAt = Date.now(); return AS.codes;
  }
  // ---------- campeones en pantalla (para distinguir juegos de una misma serie) ----------
  var DDV = null, ICONOS = {};
  function icono(id) {
    if (ICONOS[id]) return ICONOS[id];
    return (ICONOS[id] = (async function () {
      if (!DDV) DDV = (await (await fetch('https://ddragon.leagueoflegends.com/api/versions.json')).json())[0];
      var im = new Image(); im.crossOrigin = 'anonymous'; im.src = 'https://ddragon.leagueoflegends.com/cdn/' + DDV + '/img/champion/' + encodeURIComponent(id) + '.png';
      await im.decode(); return firma(im, [0.1, 0.1, 0.9, 0.9]);
    })().catch(function () { return null; }));
  }
  function firma(src, z) {  // 8×8 en color, normalizada
    var c = document.createElement('canvas'); c.width = c.height = 8;
    var x = c.getContext('2d', {willReadFrequently: true}), w = src.videoWidth || src.naturalWidth, h = src.videoHeight || src.naturalHeight;
    x.drawImage(src, z[0] * w, z[1] * h, (z[2] - z[0]) * w, (z[3] - z[1]) * h, 0, 0, 8, 8);
    var d = x.getImageData(0, 0, 8, 8).data, v = [], s = 0, n = 0, i;
    for (i = 0; i < d.length; i += 4) v.push(d[i], d[i + 1], d[i + 2]);
    for (i = 0; i < v.length; i++) s += v[i]; s /= v.length;
    for (i = 0; i < v.length; i++) { v[i] -= s; n += v[i] * v[i]; }
    n = Math.sqrt(n) || 1; return v.map(function (a) { return a / n; });
  }
  async function porCampeones(v, cands) {
    var caras = {blue: [], red: []};
    HUD.camY.forEach(function (y) {
      caras.blue.push(firma(v, [HUD.camI[0], y, HUD.camI[1], y + HUD.camH]));
      caras.red.push(firma(v, [HUD.camD[0], y, HUD.camD[1], y + HUD.camH]));
    });
    var mejor = null;
    for (var i = 0; i < cands.length; i++) {
      var c = cands[i], tot = 0, n = 0;
      for (var side in caras) {
        var ics = await Promise.all((c.champs[side] || []).map(icono));
        caras[side].forEach(function (f) { var b = -1; ics.forEach(function (ic) { if (ic) { var s = 0; for (var k = 0; k < f.length; k++) s += f[k] * ic[k]; b = Math.max(b, s); } }); if (b > -1) { tot += b; n++; } });
      }
      c.caras = n ? tot / n : null;
      if (c.caras != null && (!mejor || c.caras > mejor.caras)) mejor = c;
    }
    return mejor;
  }
  async function identificar(v, gt) {
    var C = await codigos(), lee = function (z, m) { return L.numeros(L.recorte(v, z, 'blanco'), m); };
    var sI = L.siglas(L.recorte(v, HUD.tagI, 'color'), C), sD = L.siglas(L.recorte(v, HUD.tagD, 'color'), C);
    var sig = function (s) { return s[0] && s[0].s > 0.15 && (!s[1] || s[0].s - s[1].s > 0.1) ? s[0].code : ''; };
    var kI = parseInt(lee(HUD.killI), 10), kD = parseInt(lee(HUD.killD), 10), oI = oro(lee(HUD.oroI, '0123456789K')), oD = oro(lee(HUD.oroD, '0123456789K'));
    // el oro de un equipo tiene que ser posible para ese minuto (si no, es una mala lectura y no se usa)
    var oroOk = function (x) { return x != null && x >= 2.3 + gt / 60 * 0.8 && x <= 2.8 + gt / 60 * 2.6; };
    if (!oroOk(oI) || !oroOk(oD)) { oI = oD = null; }
    if (kI > 80 || kD > 80) kI = kD = NaN;
    var mapa = function (s) { var m = {}; s.forEach(function (x) { m[x.code] = x.s; }); return m; };
    var o = {gt: gt, tags: [sig(sI), sig(sD)], sig: sI.length && sD.length ? [mapa(sI), mapa(sD)] : null, kills: isFinite(kI) && isFinite(kD) ? [kI, kD] : null, gold: oI != null && oD != null ? [oI, oD] : null};
    AS.diag.siglas = [sI.slice(0, 3), sD.slice(0, 3)]; AS.diag.marcador = o;
    var id = await R.identify(o);
    if (id && id.alts && id.alts.length) {  // empate (por ejemplo, juegos de la misma serie al principio): mirar los campeones
      var cerca = [id].concat(id.alts.filter(function (a) { return a.score - id.score < 1.5; }));
      if (cerca.length > 1) { var c = await porCampeones(v, cerca).catch(function () { return null; }); if (c && c.caras > 0.2) id = c; AS.diag.campeones = cerca.map(function (x) { return x.codes.join('-') + ' J' + x.juego + ': ' + (x.caras == null ? '—' : x.caras.toFixed(2)); }); }
    }
    AS.diag.partido = id ? id.codes.join(' vs ') + ' · J' + id.juego + ' (dif. ' + id.score.toFixed(1) + ', ' + id.revisados + ' juegos revisados)' : 'ninguno';
    return id;
  }
  async function asTick() {
    if (!AS.on || AS.busy || !L) return;
    var v = mainVideo(); if (!v || v.readyState < 2 || !v.videoWidth) return;
    AS.busy = true; AS.n++;
    try {
      var ct = v.currentTime, gt = null, zi = null, txt = '', zonas = AS.zona != null ? [AS.zona] : RELOJES.map(function (z, i) { return i; });
      for (var i = 0; i < zonas.length; i++) {
        var m = L.recorte(v, RELOJES[zonas[i]], 'blanco'); txt = L.numeros(m, '0123456789'); gt = parseReloj(txt);
        if (diagEl.classList.contains('show') && (gt != null || i === 0)) AS.diag.img = L.png(m);
        if (gt != null) { zi = zonas[i]; break; }
      }
      AS.diag.reloj = txt || '(nada)'; AS.diag.zona = zi;
      if (gt == null) {
        if (++AS.fallas >= 5) AS.zona = null;
        asEstado(AS.id ? 'sincronizado · ' + AS.id.codes.join(' vs ') + ' · sin reloj a la vista' : 'buscando el reloj del juego…', !!AS.id);
        seguir(v); return;
      }
      AS.fallas = 0; AS.visto = Date.now();
      AS.lect.push({gt: gt, ct: ct}); if (AS.lect.length > 6) AS.lect.shift();
      // dos lecturas que avanzan igual que el video antes de confiar (descarta errores sueltos del lector)
      var off = gt - ct, apoyo = AS.lect.filter(function (r) { return Math.abs((r.gt - r.ct) - off) <= 1.6; }).length;
      if (apoyo < 2) { if (!AS.id) asEstado('leyendo el reloj… ' + mmss(gt)); return; }
      AS.zona = zi;
      var salto = AS.off == null || Math.abs(off - AS.off) > 30;
      if (AS.off == null || Math.abs(off - AS.off) > 1.2) AS.off = off;
      AS.diag.desfase = off;
      if (!AS.id || salto || AS.n % 30 === 0) {
        asEstado('reconociendo el partido…', !!AS.id);
        var id = await identificar(v, gt);
        if (id && (!AS.id || id.matchId !== AS.id.matchId || id.juego !== AS.id.juego)) { AS.id = id; AS.playing = null; publicar(); }
      }
      if (!AS.id) { asEstado('no reconozco el partido (mirá el diagnóstico)'); return; }
      seguir(v);
      asEstado('auto · ' + AS.id.codes.join(' vs ') + ' · J' + AS.id.juego + ' · ' + mmss(gt), true);
      if (AS.n % 5 === 0) publicar();
    } catch (err) {
      asEstado(/insecure|tainted|SecurityError/i.test(String(err)) ? 'este video no se puede leer (protegido)' : 'auto-sync: ' + String(err).slice(0, 60));
    } finally { AS.busy = false; pintarDiag(); if (LAST) render(LAST); }
  }
  function pintarDiag() {
    if (!diagEl.classList.contains('show')) return;
    var d = AS.diag, sg = function (s) { return (s || []).map(function (x) { return esc(x.code) + ' ' + x.s.toFixed(2); }).join(', ') || '—'; };
    var mk = d.marcador || {};
    diagEl.innerHTML = '<div class="dg-t">Diagnóstico del auto-sync</div>' +
      '<div class="dg-r"><span>Estado</span><b>' + esc(d.estado || '—') + '</b></div>' +
      '<div class="dg-r"><span>Reloj leído</span><b>' + esc(d.reloj || '—') + (d.zona != null ? ' · zona ' + (d.zona + 1) : '') + '</b></div>' +
      (d.img ? '<img class="dg-i" src="' + d.img + '" alt="">' : '') +
      '<div class="dg-r"><span>Siglas izq.</span><b>' + sg(d.siglas && d.siglas[0]) + '</b></div>' +
      '<div class="dg-r"><span>Siglas der.</span><b>' + sg(d.siglas && d.siglas[1]) + '</b></div>' +
      '<div class="dg-r"><span>Kills · oro</span><b>' + (mk.kills ? mk.kills.join('–') : '—') + ' · ' + (mk.gold ? mk.gold.join('k – ') + 'k' : '—') + '</b></div>' +
      '<div class="dg-r"><span>Partido</span><b>' + esc(d.partido || '—') + '</b></div>' +
      (d.campeones ? '<div class="dg-r"><span>Campeones</span><b>' + esc(d.campeones.join(' · ')) + '</b></div>' : '') +
      '<div class="dg-r"><span>Video</span><b>' + (function () { var v = mainVideo(); return v ? v.videoWidth + '×' + v.videoHeight + ' · ' + mmss(v.currentTime) + (v.paused ? ' · en pausa' : '') : 'no hay video'; })() + '</b></div>' +
      '<div class="dg-n">Si no sincroniza, sacá una captura de este cuadro.</div>';
  }
  setInterval(function () { asTick(); }, 1500);
  // pausa, velocidad o salto del video: el minuto sale de la posición del video, así que basta con volver a atar
  ['pause', 'play', 'ratechange', 'seeked', 'waiting', 'playing'].forEach(function (ev) { document.addEventListener(ev, function (e) {
    if (!AS.on || e.target !== mainVideo()) return;
    if (ev === 'seeked') AS.lect = [];  // tras un salto, confirmar de nuevo con el reloj
    AS.playing = null; seguir(e.target); }, true); });

  R.onUpdate(render);
  if (!window.RP_NO_AUTOSTART) R.start();
})();
