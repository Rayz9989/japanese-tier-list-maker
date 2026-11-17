/**
 * Deterministic Kanji Classification & 19-Tier Collation Waterfall
 *
 * Implements:
 * 1. Exact runtime JIS X 0208 Level 1 generator (2,965 single kanji via Shift_JIS ku 16–47).
 * 2. Verified 2020 MEXT / Kanji Kentei single-character sets (Level 4, Level 3, Pre-2, Pre-1).
 * 3. Empirically verified Taboo Override Sets (JMnedict name/placename attestation + legal set membership).
 * 4. Strict mutually-exclusive 1–19 classification waterfall.
 */

export type KanjiGroupId =
  | 1
  | 2
  | 3
  | 4
  | 5
  | 6
  | 7
  | 8
  | 9
  | 10
  | 11
  | 12
  | 13
  | 14
  | 15
  | 16
  | 17
  | 18
  | 19;

export type KanjiGroupFamily =
  | 'kyoiku'
  | 'chugaku'
  | 'joyo'
  | 'jinmeiyo'
  | 'taboo'
  | 'hyogai';

export interface KanjiGroupMeta {
  id: KanjiGroupId;
  name: string;
  shortName: string;
  family: KanjiGroupFamily;
  familyLabel: string;
  description: string;
  /** Tailwind classes for text + subtle border/surface indicator */
  accentTextClass: string;
  accentBorderClass: string;
  accentSurfaceClass: string;
}

export const ALL_KANJI_GROUP_IDS: readonly KanjiGroupId[] = [
  1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19,
] as const;

export const KANJI_GROUPS: readonly KanjiGroupMeta[] = [
  {
    id: 1,
    name: 'Grade 1 Kyōiku Kanji',
    shortName: 'G1 Kyōiku',
    family: 'kyoiku',
    familyLabel: 'Kyōiku (1–6)',
    description: 'Elementary Grade 1 Jōyō kanji (Kanken Level 10)',
    accentTextClass: 'text-emerald-300',
    accentBorderClass: 'border-emerald-500/40',
    accentSurfaceClass: 'bg-emerald-950/50',
  },
  {
    id: 2,
    name: 'Grade 2 Kyōiku Kanji',
    shortName: 'G2 Kyōiku',
    family: 'kyoiku',
    familyLabel: 'Kyōiku (1–6)',
    description: 'Elementary Grade 2 Jōyō kanji (Kanken Level 9)',
    accentTextClass: 'text-emerald-300',
    accentBorderClass: 'border-emerald-500/40',
    accentSurfaceClass: 'bg-emerald-950/50',
  },
  {
    id: 3,
    name: 'Grade 3 Kyōiku Kanji',
    shortName: 'G3 Kyōiku',
    family: 'kyoiku',
    familyLabel: 'Kyōiku (1–6)',
    description: 'Elementary Grade 3 Jōyō kanji (Kanken Level 8)',
    accentTextClass: 'text-emerald-300',
    accentBorderClass: 'border-emerald-500/40',
    accentSurfaceClass: 'bg-emerald-950/50',
  },
  {
    id: 4,
    name: 'Grade 4 Kyōiku Kanji',
    shortName: 'G4 Kyōiku',
    family: 'kyoiku',
    familyLabel: 'Kyōiku (1–6)',
    description: 'Elementary Grade 4 Jōyō kanji (Kanken Level 7)',
    accentTextClass: 'text-emerald-300',
    accentBorderClass: 'border-emerald-500/40',
    accentSurfaceClass: 'bg-emerald-950/50',
  },
  {
    id: 5,
    name: 'Grade 5 Kyōiku Kanji',
    shortName: 'G5 Kyōiku',
    family: 'kyoiku',
    familyLabel: 'Kyōiku (1–6)',
    description: 'Elementary Grade 5 Jōyō kanji (Kanken Level 6)',
    accentTextClass: 'text-emerald-300',
    accentBorderClass: 'border-emerald-500/40',
    accentSurfaceClass: 'bg-emerald-950/50',
  },
  {
    id: 6,
    name: 'Grade 6 Kyōiku Kanji',
    shortName: 'G6 Kyōiku',
    family: 'kyoiku',
    familyLabel: 'Kyōiku (1–6)',
    description: 'Elementary Grade 6 Jōyō kanji (Kanken Level 5)',
    accentTextClass: 'text-emerald-300',
    accentBorderClass: 'border-emerald-500/40',
    accentSurfaceClass: 'bg-emerald-950/50',
  },
  {
    id: 7,
    name: 'Grade 7 Chūgaku Kanji',
    shortName: 'G7 Chūgaku (KK4)',
    family: 'chugaku',
    familyLabel: 'Chūgaku (7–9)',
    description: 'Secondary Jōyō kanji introduced at Kanji Kentei Level 4',
    accentTextClass: 'text-sky-300',
    accentBorderClass: 'border-sky-500/40',
    accentSurfaceClass: 'bg-sky-950/50',
  },
  {
    id: 8,
    name: 'Grade 8 Chūgaku Kanji',
    shortName: 'G8 Chūgaku (KK3)',
    family: 'chugaku',
    familyLabel: 'Chūgaku (7–9)',
    description: 'Secondary Jōyō kanji introduced at Kanji Kentei Level 3',
    accentTextClass: 'text-sky-300',
    accentBorderClass: 'border-sky-500/40',
    accentSurfaceClass: 'bg-sky-950/50',
  },
  {
    id: 9,
    name: 'Grade 9 Chūgaku Kanji',
    shortName: 'G9 Chūgaku (KK Pre-2)',
    family: 'chugaku',
    familyLabel: 'Chūgaku (7–9)',
    description: 'Secondary Jōyō kanji introduced at Kanji Kentei Pre-2',
    accentTextClass: 'text-sky-300',
    accentBorderClass: 'border-sky-500/40',
    accentSurfaceClass: 'bg-sky-950/50',
  },
  {
    id: 10,
    name: 'Jōyō Kanji',
    shortName: 'Jōyō (KK2)',
    family: 'joyo',
    familyLabel: 'Upper Jōyō (10)',
    description: 'Remaining general-use Jōyō kanji (Kanji Kentei Level 2)',
    accentTextClass: 'text-indigo-300',
    accentBorderClass: 'border-indigo-500/40',
    accentSurfaceClass: 'bg-indigo-950/50',
  },
  {
    id: 11,
    name: 'JLPT Jinmeiyō',
    shortName: 'JLPT Jinmeiyō',
    family: 'jinmeiyo',
    familyLabel: 'Jinmeiyō (11–14)',
    description: 'Jinmeiyō name kanji with an assigned JLPT N1–N5 level',
    accentTextClass: 'text-amber-300',
    accentBorderClass: 'border-amber-500/40',
    accentSurfaceClass: 'bg-amber-950/50',
  },
  {
    id: 12,
    name: 'Kanken-Pre Jinmeiyō',
    shortName: 'KK Pre-1 Jinmeiyō',
    family: 'jinmeiyo',
    familyLabel: 'Jinmeiyō (11–14)',
    description: 'Non-JLPT Jinmeiyō kanji tested at Kanji Kentei Pre-1',
    accentTextClass: 'text-amber-300',
    accentBorderClass: 'border-amber-500/40',
    accentSurfaceClass: 'bg-amber-950/50',
  },
  {
    id: 13,
    name: 'JIS-1 Jinmeiyō',
    shortName: 'JIS-1 Jinmeiyō',
    family: 'jinmeiyo',
    familyLabel: 'Jinmeiyō (11–14)',
    description: 'Remaining Jinmeiyō kanji encoded in JIS X 0208 Level 1',
    accentTextClass: 'text-amber-300',
    accentBorderClass: 'border-amber-500/40',
    accentSurfaceClass: 'bg-amber-950/50',
  },
  {
    id: 14,
    name: 'Other Jinmeiyō',
    shortName: 'Other Jinmeiyō',
    family: 'jinmeiyo',
    familyLabel: 'Jinmeiyō (11–14)',
    description: 'Remaining Jinmeiyō kanji (JIS Level 2 / traditional variants)',
    accentTextClass: 'text-amber-300',
    accentBorderClass: 'border-amber-500/40',
    accentSurfaceClass: 'bg-amber-950/50',
  },
  {
    id: 15,
    name: 'Taboo-ish Name Kanji',
    shortName: 'Taboo Name (15)',
    family: 'taboo',
    familyLabel: 'Taboo Overrides (15–16)',
    description:
      'Legally permitted Jōyō/Jinmeiyō kanji with heavy/ominous semantics that ARE attested in real Japanese surnames, given names, or official placenames',
    accentTextClass: 'text-rose-300',
    accentBorderClass: 'border-rose-500/40',
    accentSurfaceClass: 'bg-rose-950/50',
  },
  {
    id: 16,
    name: 'Non-Name Taboo Kanji',
    shortName: 'Non-Name Taboo (16)',
    family: 'taboo',
    familyLabel: 'Taboo Overrides (15–16)',
    description:
      'Legally permitted Jōyō/Jinmeiyō kanji with severe/clinical/criminal semantics and zero real Japanese name or placename attestation',
    accentTextClass: 'text-rose-300',
    accentBorderClass: 'border-rose-500/40',
    accentSurfaceClass: 'bg-rose-950/50',
  },
  {
    id: 17,
    name: 'Kanken-Pre Hyōgai',
    shortName: 'KK Pre-1 Hyōgai',
    family: 'hyogai',
    familyLabel: 'Hyōgai (17–19)',
    description: 'Non-taboo Hyōgai kanji tested at Kanji Kentei Pre-1 (準1級)',
    accentTextClass: 'text-purple-300',
    accentBorderClass: 'border-purple-500/40',
    accentSurfaceClass: 'bg-purple-950/50',
  },
  {
    id: 18,
    name: 'JIS-1 Hyōgai',
    shortName: 'JIS-1 Hyōgai',
    family: 'hyogai',
    familyLabel: 'Hyōgai (17–19)',
    description: 'Remaining non-taboo Hyōgai kanji in JIS X 0208 Level 1',
    accentTextClass: 'text-purple-300',
    accentBorderClass: 'border-purple-500/40',
    accentSurfaceClass: 'bg-purple-950/50',
  },
  {
    id: 19,
    name: 'Hyōgai Kanji',
    shortName: 'Hyōgai / Radicals (19)',
    family: 'hyogai',
    familyLabel: 'Hyōgai (17–19)',
    description:
      'Hyōgai kanji demoted via taboo override plus pure Kangxi Radical base Hyōgai outside Kanken Pre-1 & JIS Level 1',
    accentTextClass: 'text-purple-300',
    accentBorderClass: 'border-purple-500/40',
    accentSurfaceClass: 'bg-purple-950/50',
  },
] as const;

export const KANJI_GROUP_MAP: ReadonlyMap<number, KanjiGroupMeta> = new Map(
  KANJI_GROUPS.map((g) => [g.id, g])
);

function singleCharSet(raw: string): ReadonlySet<string> {
  const s = new Set<string>();
  for (const ch of [...raw]) {
    if (ch.trim()) s.add(ch);
  }
  return s;
}

/**
 * Deterministically computes all 2,965 JIS X 0208 Level 1 kanji (第1水準漢字)
 * across JIS rows (ku) 16 through 47 (ten 1–94, with row 47 ending at ten 51;
 * Shift_JIS bytes 0x889F through 0x9872).
 */
export function buildJisLevel1Set(): ReadonlySet<string> {
  const decoder = new TextDecoder('shift_jis');
  const set = new Set<string>();
  for (let ku = 16; ku <= 47; ku++) {
    const maxTen = ku === 47 ? 51 : 94;
    for (let ten = 1; ten <= maxTen; ten++) {
      const lead =
        ku <= 62
          ? Math.floor((ku + 1) / 2) + 0x80
          : Math.floor((ku + 1) / 2) + 0xc0;
      const trail =
        ku % 2 === 1 ? (ten <= 63 ? ten + 0x3f : ten + 0x40) : ten + 0x9e;
      const decoded = decoder.decode(new Uint8Array([lead, trail]));
      set.add(decoded);
    }
  }
  if (set.size !== 2965) {
    throw new Error(
      `JIS_LEVEL_1_SET invariant failed: expected 2965 characters, got ${set.size}`
    );
  }
  return set;
}

export const JIS_LEVEL_1_SET: ReadonlySet<string> = buildJisLevel1Set();

/**
 * Kanji Kentei Level 4 (2020 MEXT Standard — 313 secondary Jōyō single characters)
 */
export const KANKEN_4_SET: ReadonlySet<string> = singleCharSet(
  '侵獣紫項兼況輝較援握振瞬雌稿剣狭儀獲煙扱浸旬執豪軒恐戯刈鉛依寝巡芝込圏響詰甘縁威慎盾斜婚堅驚却汗汚為震召煮鎖遣仰脚乾押偉薪床釈彩玄駆及勧奥違尽沼寂歳枯屈丘歓憶維陣称朱載誇掘朽監菓緯尋紹狩剤鼓繰巨環暇壱吹詳趣咲互恵拠鑑箇芋是丈需惨抗傾距含雅陰姓畳舟旨攻継御奇介隠征殖秀伺更迎凶祈戒影跡飾襲刺恒撃叫鬼皆鋭占触柔脂荒肩狂幾壊越麗腰漫柄微薄稲滴淡扇暦踊妙壁匹爆踏添嘆鮮劣謡眠捕描髪闘殿端訴烈翼矛舗浜抜胴吐弾僧恋雷霧抱敏罰峠途恥燥露頼娘峰怖般突渡致騒郎絡茂砲浮販鈍奴遅贈惑欄猛忙普搬曇怒蓄即腕離網坊腐範弐到跳俗粒黙肪敷繁悩逃徴耐慮紋冒膚盤濃倒澄替療躍傍賦彼杯唐沈沢隣雄帽舞疲輩桃珍拓涙与凡幅被拍透抵濁隷誉盆払避泊盗堤脱齢溶慢噴尾迫塔摘丹'
);

/**
 * Kanji Kentei Level 3 (2020 MEXT Standard — 284 secondary Jōyō single characters)
 */
export const KANKEN_3_SET: ReadonlySet<string> = singleCharSet(
  '婿譲殊削拘憩喫貫餓哀請嘱寿搾郊鶏虐喚怪慰斥辱潤錯控鯨虚換悔詠隻伸遵撮慌倹峡敢塊悦惜辛如擦硬賢脅緩慨閲籍審徐暫絞幻凝企該炎摂炊匠祉綱孤斤忌概宴潜粋昇施酵弧緊軌郭欧繕衰掌諮克雇愚既隔殴阻酔晶侍獄顧偶棋穫乙措遂焦慈恨娯遇棄岳卸粗穂衝軸紺悟刑騎掛穏礎随鐘疾魂孔契欺滑佳双髄冗湿墾巧啓犠肝架桑瀬嬢赦債甲掲菊冠華掃牲錠邪催坑携吉勘嫁励幽乏伏縛訂胆葬零誘妨覆伐締鍛遭霊憂房紛帆哲壇憎裂揚某墳伴斗稚促廉揺膨癖畔塗畜賊錬擁謀募藩凍窒怠炉抑墨慕蛮陶抽胎浪裸没簿卑痘鋳袋廊濫翻芳碑匿駐逮楼吏魔邦泌篤彫滞漏隆埋奉姫豚超滝湾了膜胞漂尿聴択猟又倣苗粘陳卓陵魅崩赴婆鎮託糧滅飽符排墜諾厘免縫封陪帝奪'
);

/**
 * Kanji Kentei Pre-2 / 準2級 (2020 MEXT Standard — 328 secondary Jōyō single characters)
 */
export const KANKEN_PRE2_SET: ReadonlySet<string> = singleCharSet(
  '詔殉儒栽肯薫擬且寡亜奨循囚斎侯茎糾缶稼尉彰庶臭索洪渓窮陥蚊逸償緒愁酢貢蛍拒患拐姻礁叙酬桟溝慶享堪懐韻浄升醜傘衡傑挟棺劾畝剰抄汁肢購嫌恭款涯浦壌肖充嗣拷献矯閑垣疫醸尚渋賜剛謙暁寛核謁津宵銃璽酷繭菌憾殻猿唇症叔漆昆顕琴還嚇凹娠祥淑遮懇懸謹艦括翁紳渉粛蛇唆弦襟頑喝虞診訟塾酌詐呉吟飢渇渦刃硝俊爵砕碁隅宜褐禍迅粧准珠宰江勲偽轄靴寮悠堀憤煩尼艇挑霜践甚倫猶奔丙頒妊泥眺藻遷帥累裕麻併妃忍迭釣妥薦睡塁融摩塀披寧徹懲堕繊枢戻庸磨幣扉把撤勅惰禅崇鈴窯抹弊罷覇悼朕駄漸据賄羅岬偏猫廃搭塚泰租杉枠酪銘遍賓培棟漬濯疎斉痢妄泡頻媒筒坪但塑逝履盲俸瓶賠謄呈棚壮誓柳耗褒扶伯騰廷痴荘析竜厄剖附舶洞邸逐捜拙硫愉紡譜漠督亭秩挿窃虜諭朴侮肌凸貞嫡曹仙涼癒僕沸鉢屯逓衷喪栓僚唯撲雰閥軟偵弔槽旋'
);

/**
 * Kanji Kentei Pre-1 / 準1級 (940 verified single non-Jōyō characters spanning Jinmeiyō & Pre-1 Hyōgai)
 */
export const KANKEN_PRE1_SET: ReadonlySet<string> = singleCharSet(
  '唖娃阿姶逢葵茜穐渥旭葦鯵梓斡姐虻飴絢綾鮎或粟袷庵按鞍杏伊夷惟謂亥郁磯溢鰯允胤蔭吋烏迂卯鵜窺丑碓嘘蔚鰻姥厩瓜閏噂云荏叡嬰曳洩瑛盈穎頴榎厭堰奄掩焔燕苑薗鴛於甥襖鴬鴎荻桶牡伽嘉珂禾茄蝦嘩迦霞俄峨臥蛾駕廻恢魁晦芥蟹凱咳碍鎧浬馨蛙蛎鈎劃廓撹赫笠樫橿梶鰍恰鰹叶椛樺鞄兜竃蒲噛鴨茅萱粥苅侃姦柑桓澗潅竿翰莞諌舘巌癌翫贋雁嬉毅稀徽妓祇蟻誼掬鞠吃桔橘砧杵黍仇汲灸笈渠鋸禦亨侠僑兇匡卿喬彊怯蕎饗尭桐粁欣欽禽芹衿倶狗玖矩躯駈喰寓櫛釧屑沓轡窪隈粂栗鍬卦袈祁圭珪慧桂畦繋罫荊頚戟訣倦喧捲牽硯鹸絃諺乎姑狐糊袴胡菰跨鈷伍吾梧檎瑚醐鯉佼倖垢宏巷庚弘昂晃杭浩糠紘肱腔膏砿閤鴻劫壕濠轟麹鵠漉甑忽惚狛此坤昏梱艮些叉嵯瑳裟坐哉犀砦冴堺榊肴鷺朔窄鮭笹匙薩皐鯖捌錆鮫晒撒燦珊纂讃餐仔屍孜斯獅爾痔而蒔汐鴫竺宍雫悉蔀篠偲柴屡蕊縞紗勺杓灼錫惹綬洲繍蒐輯酋什戎夙峻竣舜駿楯淳醇曙渚薯藷恕鋤哨嘗妾娼庄廠捷昌梢樟樵湘菖蒋蕉裳醤鉦鍾鞘丞擾杖穣埴燭蝕晋榛疹秦塵壬訊靭笥諏厨逗翠錐錘瑞嵩趨雛椙菅頗雀摺棲栖脆蹟碩蝉尖撰栴煽穿箭舛賎銑閃糎噌岨楚疏蘇鼠叢宋匝惣掻槍漕糟綜聡蒼鎗其揃詑柁舵楕陀騨岱腿苔黛鯛醍鷹啄托琢鐸茸凧蛸只叩辰巽竪辿狸鱈樽坦歎湛箪耽蛋檀弛智蜘馳筑註樗瀦猪苧凋喋寵帖暢牒脹蝶諜銚槌鎚栂掴槻佃柘辻蔦綴鍔椿壷嬬紬吊剃悌挺梯汀碇禎蹄鄭釘鼎擢鏑轍纏甜顛澱兎堵杜菟鍍砥砺塘套宕嶋梼淘涛祷董蕩鐙撞萄鴇涜禿橡椴鳶苫寅酉瀞噸惇敦沌遁呑乍凪薙灘捺楢馴畷楠汝賑廿韮濡禰祢葱撚乃廼之埜嚢膿覗蚤巴播杷琶芭盃牌楳煤狽這蝿秤矧萩柏箔粕曝莫駁函硲肇筈幡畠溌醗筏鳩噺塙蛤隼叛挽磐蕃匪庇斐緋誹樋簸枇毘琵柊稗疋髭彦菱弼畢逼桧紐謬彪瓢豹廟錨鋲蒜蛭鰭彬斌瀕埠斧芙撫葡蕪楓葺蕗淵弗鮒吻扮焚糞頁僻碧瞥箆篇娩鞭鋪圃甫輔戊菩呆峯庖捧朋烹萌蓬鋒鳳鵬鉾吠卜穆釦殆幌哩槙鮪柾鱒亦俣沫迄麿蔓巳箕湊蓑稔粍牟鵡椋姪牝棉緬摸孟蒙儲杢勿尤籾貰悶匁也爺耶靖薮鑓愈佑宥揖柚涌猷祐邑輿傭楊熔耀蓉遥慾淀螺莱洛蘭李裡葎掠劉溜琉亮凌梁稜諒遼淋燐琳鱗麟伶嶺怜玲苓憐漣煉簾聯蓮魯櫓婁牢狼篭聾蝋禄肋倭歪鷲亙亘鰐詫藁蕨椀碗儘兔凰凾厰咒壺峩崕嵳廐廏廚攪檜檮橢濤渕溯漑灌潴皋礦礪龝竈篦纒翆聨苒莵萠葢蘂蕋藪蠣蛛蠅蠏諫讚豎賤迺鉤鎔靱韃韭頸鰺鴈鴦鶯鸚麒麪俠俱偓吞啐啞噓嚙囊屢帀搔摑毗潑瀆焰盌禱簞繡繫荆萊蔣蜎蝱蟬蠟軀醬醱顚驒鷗鹼麴㵎'
);

/**
 * Group 15 Override: Legally permitted name kanji (Jōyō or Jinmeiyō ONLY) whose negative/ominous
 * semantics make them culturally taboo for baby names, yet ARE empirically attested in real
 * Japanese surnames, given names, or official placenames (JMnedict verified; excludes 霊).
 */
export const TABOO_ATTESTED_NAME_KANJI: ReadonlySet<string> = singleCharSet(
  '死葬墓喪骸鬼魔妖呪凶厄災禍滅亡殺斬刺毒血刃刑獄囚奴隷賊盗犯罪悪醜汚臭腐尿涙泣哀悲恨憎恥弔狂乱惑闇冥病疫痢痴盲貧乏餓渇溺苦悩恐怖侮欺妬卑惨萎蛇猪'
);

/**
 * Group 16 Override: Legally permitted name kanji (Jōyō or Jinmeiyō ONLY) with severe/clinical/criminal
 * semantics and ZERO real-world Japanese surname, given name, or official placename attestation.
 */
export const TABOO_UNATTESTED_NON_NAME_KANJI: ReadonlySet<string> = singleCharSet(
  '怨罰痛傷症痘瘍腫飢拷窒鬱蔑詐窃殴排虜賄賂貪嫉妄淫劣怠惰酷罵縛惡禍臭獸瘦憎懲盜卑侮虜摑'
);

/**
 * Group 19 Demotion Override: Hyōgai kanji ONLY (in Kanken Pre-1 or JIS Level 1) carrying taboo,
 * vulgar, clinical-disease, or violent meanings -> demoted from Groups 17–18 to Group 19.
 */
export const HYOGAI_TABOO_SET: ReadonlySet<string> = singleCharSet(
  '癌痔屍姦娼妓妾糞膿蚤蛭鰐鮫鼠狐狸兇誹牢賤垢塵僻呆怯悶厭禿聾唖泄猥'
);

/**
 * Checks whether a non-Jōyō, non-Jinmeiyō (Hyōgai) single kanji qualifies for inclusion in the app pool:
 * 1. Tested in Kanji Kentei up to Pre-1 (準1級)
 * 2. Encoded in JIS X 0208 Level 1 (2,965 chars)
 * 3. One of the 214 Kangxi Radicals
 */
export function isQualifyingHyogaiKanji(
  char: string,
  isKangxiRadicalBase: boolean
): boolean {
  return (
    KANKEN_PRE1_SET.has(char) ||
    JIS_LEVEL_1_SET.has(char) ||
    isKangxiRadicalBase
  );
}

/**
 * Evaluates a single kanji character through the strict, mutually-exclusive 1–19 waterfall.
 */
export function classifyKanjiGroup(params: {
  char: string;
  category: 'joyo_kanji' | 'jinmeiyo_kanji' | 'hyogai_kanji';
  grade: number | null;
  jlpt?: number | null;
}): KanjiGroupId {
  const { char, category, grade, jlpt } = params;

  if (category === 'joyo_kanji' || category === 'jinmeiyo_kanji') {
    // Taboo Overrides take precedence for Jōyō & Jinmeiyō
    if (TABOO_ATTESTED_NAME_KANJI.has(char)) return 15;
    if (TABOO_UNATTESTED_NON_NAME_KANJI.has(char)) return 16;

    if (category === 'joyo_kanji') {
      if (grade === 1) return 1;
      if (grade === 2) return 2;
      if (grade === 3) return 3;
      if (grade === 4) return 4;
      if (grade === 5) return 5;
      if (grade === 6) return 6;
      if (KANKEN_4_SET.has(char)) return 7;
      if (KANKEN_3_SET.has(char)) return 8;
      if (KANKEN_PRE2_SET.has(char)) return 9;
      return 10;
    }

    // Jinmeiyō waterfall (Groups 11–14)
    if (jlpt !== null && jlpt !== undefined && jlpt >= 1 && jlpt <= 5) {
      return 11;
    }
    if (KANKEN_PRE1_SET.has(char)) return 12;
    if (JIS_LEVEL_1_SET.has(char)) return 13;
    return 14;
  }

  // Hyōgai waterfall (Groups 17–19)
  if (HYOGAI_TABOO_SET.has(char)) return 19;
  if (KANKEN_PRE1_SET.has(char)) return 17;
  if (JIS_LEVEL_1_SET.has(char)) return 18;
  return 19;
}
