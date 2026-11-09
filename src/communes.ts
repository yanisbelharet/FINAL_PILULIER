// Communes proposées dans les formulaires : paquet algeria-locations + communes qui y manquent
// (présentes chez les sociétés de livraison EcoTrack : HHD, SWIFT, NAVEX). Chargé à la demande (import dynamique).
import { getCommunesByWilayaId as baseCommunes } from 'algeria-locations';

const EXTRA_COMMUNES: Record<number, string[]> = {"2":["المرسى"],"4":["أولاد زواي"],"5":["الحاسي","لارباع","لمسان","تالخمت"],"6":["تيمزريت"],"9":["بوقرة"],"10":["عين الحجر","عين الترك","الشرفة","المعمورة","أولاد راشد","تاغزوت"],"12":["العقلة","الحمامات"],"13":["بني بوسعيد","المنصورة","وادي الشولي"],"14":["السبت","سيدي عبد الرحمن"],"15":["أبي يوسف","أيت أومالو"],"16":["المرسى","المحمدية","سيدي امحمد"],"17":["دلدول"],"19":["القلتة الزرقاء"],"20":["أولاد ابراهيم","سيدي عمر"],"21":["الولجة بولبلوط","الزيتونة"],"22":["بن باديس","سيدي خالد"],"23":["العلمة","تريعات"],"24":["عين حساينية","بني مزلين","بوحمدان","خزارة"],"26":["بوعيش","دمياط","العوينات","مزرانة","سيدي زيان"],"27":["الصفصاف"],"28":["الهوامد","المطارفة","مناعة","سيدي عامر"],"29":["عين فارس","تيزي"],"30":["عين البيضاء"],"31":["عين الكرمة"],"32":["سيدي عامر","سيدي سليمان"],"34":["الحمادية","المنصورة"],"35":["الخروبة","أولاد عيسى","سوق الحد"],"36":["البسباس"],"38":["خميستي","الأربعاء","سيدي سليمان"],"40":["الولجة"],"41":["عين سلطان","سيدي فرج"],"42":["الشعيبة","سيدي عمر"],"44":["سيدي لخضر"],"46":["شنتوف","الأمير عبد القادر","الحساسنة"],"48":["الولجة","سوق الحد"]};

export type Commune = { id: number; name_ar: string; name?: string };

export function getCommunesByWilayaId(wilayaId: number): Commune[] {
  const list: Commune[] = (baseCommunes(wilayaId) || []) as Commune[];
  const have = new Set(list.map(c => c.name_ar));
  const extra = (EXTRA_COMMUNES[wilayaId] || []).filter(n => !have.has(n)).map((name_ar, i) => ({ id: wilayaId * 1000 + 900 + i, name_ar }));
  return [...list, ...extra].sort((a, b) => a.name_ar.localeCompare(b.name_ar, 'ar'));
}
