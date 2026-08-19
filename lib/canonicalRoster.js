// Approved staff structure from the 2026-08-19 workbook.
const DATA = `2011|Ротшильд|Маэльреян|moderator||||2011
2297|Шайкулова|Малика|director|Алматы|Corneli Mega Alma-Ata|Corneli|2297
2013|Айдар|Аруна|admin|Алматы|Corneli Mega Alma-Ata|Corneli|2013
2014|Сапиева|Айдана|admin|Алматы|Corneli Mega Alma-Ata|Corneli|2014
2015|Жұмағалиқызы|Анэля|stylist|Алматы|Corneli Mega Alma-Ata|Corneli|2015
2016|Зикранец|Эльвира|stylist|Алматы|Corneli Mega Alma-Ata|Corneli|2016
2017|Кузиева|Анора|stylist|Алматы|Corneli Mega Alma-Ata|Corneli|2017
2018|Рахметілдә|Әнел|stylist|Алматы|Corneli Mega Alma-Ata|Corneli|2018
2019|Хасанова|Гюнел|stylist|Алматы|Corneli Mega Alma-Ata|Corneli|2019
2020|Кожевникова|Ульяна|director|Алматы|Corneli Mega Park Almaty|Corneli|2020
2021|Жахан|Асылайым|stylist|Алматы|Corneli Mega Park Almaty|Corneli|2021
2022|Завьялов|Дмитрий|stylist|Алматы|Corneli Mega Park Almaty|Corneli|2022
2023|Сапарғали|Абылай|stylist|Алматы|Corneli Mega Park Almaty|Corneli|2023
2024|Алимбекова|Айгерим|director|Атырау|Corneli Atyrau Baizaar|Corneli|2024
2025|Исламова|Әсемгүл|admin|Атырау|Corneli Atyrau Baizaar|Corneli|2025
2026|Таупихова|Гулдана|stylist|Атырау|Corneli Atyrau Baizaar|Corneli|2026
2027|Хайролла|Абылай|stylist|Атырау|Corneli Atyrau Baizaar|Corneli|2027
2028|Сейтбек|Айсұлу|director|Актау|Corneli Aktau|Corneli|2028
2029|Янтудина|Альбина|admin|Актау|Corneli Aktau|Corneli|2029
2030|Жайлау|Адина|stylist|Актау|Corneli Aktau|Corneli|2030
2031|Кенжебаева|Дилназ|stylist|Актау|Corneli Aktau|Corneli|2031
2032|Молдабек|Анар|stylist|Актау|Corneli Aktau|Corneli|2032
2033|Калиханова|Зарина|director|Астана|Corneli Mega Silkway|Corneli|2033
2034|Бейсембаев|Алтынбек|admin|Астана|Corneli Mega Silkway|Corneli|2034
2035|Исмаганбетова|Карлыгаш|admin|Астана|Corneli Mega Silkway|Corneli|2035
2036|Әзімбек|Айдана|stylist|Астана|Corneli Mega Silkway|Corneli|2036
2037|Базарбаева|Ақмарал|stylist|Астана|Corneli Mega Silkway|Corneli|2037
2038|Жұмажан|Милана|stylist|Астана|Corneli Mega Silkway|Corneli|2038
2039|Кимадиева|Адила|stylist|Астана|Corneli Mega Silkway|Corneli|2039
2040|Кусаинова|Олеся|stylist|Астана|Corneli Mega Silkway|Corneli|2040
2041|Әмірәлі|Асылжан|director|Астана|Crinzo Astana Mega Silkway|Crinzo|2041
2042|Калиев|Диас|admin|Астана|Crinzo Astana Mega Silkway|Crinzo|2042
2043|Басар|Эльдар|stylist|Астана|Crinzo Astana Mega Silkway|Crinzo|2043
2044|Ермекбай|Әлихан|stylist|Астана|Crinzo Astana Mega Silkway|Crinzo|2044
2045|Жолдықожаева|Әсем|stylist|Астана|Crinzo Astana Mega Silkway|Crinzo|2045
2046|Жусупова|Балбопе|stylist|Астана|Crinzo Astana Mega Silkway|Crinzo|2046
2047|Тулегенқызы|Алина|stylist|Астана|Crinzo Astana Mega Silkway|Crinzo|2047
2048|Имамбекова|Гүлнұр|director|Алматы|Corneli Almaty Al-Farabi|Corneli|2048
2049|Болатова|Айша|admin|Алматы|Corneli Almaty Al-Farabi|Corneli|2049
2050|Дуйсенбина|Лаура|stylist|Алматы|Corneli Almaty Al-Farabi|Corneli|2050
2051|Зулпукарова|Алтинай|stylist|Алматы|Corneli Almaty Al-Farabi|Corneli|2051
2052|Исабекова|Улбосын|stylist|Алматы|Corneli Almaty Al-Farabi|Corneli|2052
2053|Максетбаева|Жазира|stylist|Алматы|Corneli Almaty Al-Farabi|Corneli|2053
2054|Муратова|Акерке|stylist|Алматы|Corneli Almaty Al-Farabi|Corneli|2054
2055|Мукеева|Айсулу|director|Алматы|Corneli Almaty Outlet|Corneli|2055
2056|Ибаділдаев|Бекжан|admin|Алматы|Corneli Almaty Outlet|Corneli|2056
2057|Куатова|Анель|online_manager|Алматы|Corneli Almaty Outlet|Corneli|2057
2058|Муратбек|Айзере|online_manager|Алматы|Corneli Almaty Outlet|Corneli|2058
2059|Кадирова|Зулфия|stylist|Алматы|Corneli Almaty Outlet|Corneli|2059
2060|Купжасарова|Алина|stylist|Алматы|Corneli Almaty Outlet|Corneli|2060
2061|Төрешова|Жазира|director|Алматы|Crinzo Almaty Zheltoksan|Crinzo|2061
2062|Қуанышев|Дәурен|admin|Алматы|Crinzo Almaty Zheltoksan|Crinzo|2062
2063|Бұхарбаева|Жансая|stylist|Алматы|Crinzo Almaty Zheltoksan|Crinzo|2063
2064|Джынгылбаева|Айнур|stylist|Алматы|Crinzo Almaty Zheltoksan|Crinzo|2064
2065|Ниетбай|Абылайхан|stylist|Алматы|Crinzo Almaty Zheltoksan|Crinzo|2065
2066|Дилдабай|Аяулым|director|Алматы|Crinzo Almaty Outlet|Crinzo|2066
2067|Мұқаш|Аруна|admin|Алматы|Crinzo Almaty Outlet|Crinzo|2067
2068|Ахмади|Балнұр|stylist|Алматы|Crinzo Almaty Outlet|Crinzo|2068
2069|Номан|Нұрай|stylist|Алматы|Crinzo Almaty Outlet|Crinzo|2069
2070|Қосынбаев|Жандос|director|Кызыл-Орда|Crinzo Kyzylorda|Crinzo|2070
2071|Абибуллаева|Малика|admin|Кызыл-Орда|Crinzo Kyzylorda|Crinzo|2071
2072|Аманжолова|Ұлжан|stylist|Кызыл-Орда|Crinzo Kyzylorda|Crinzo|2072
2073|Базарбаева|Меруерт|stylist|Кызыл-Орда|Crinzo Kyzylorda|Crinzo|2073
2074|Садуақас|Асхат|director|Астана|Crinzo Astana Mangilik El|Crinzo|2074
2075|Базарбаев|Бексұлтан|admin|Астана|Crinzo Astana Mangilik El|Crinzo|2075
2076|Ибрагимова|Таншолпан|online_manager|Астана|Crinzo Astana Mangilik El|Crinzo|2076
2077|Ербол|Тасмина|stylist|Астана|Crinzo Astana Mangilik El|Crinzo|2077
2078|Шарибхан|Ақжүніс|stylist|Астана|Crinzo Astana Mangilik El|Crinzo|2078
2079|Кульбатырова|Ислана|director|Астана|Corneli Astana Turan|Corneli|2079
2080|Өмірзақ|Нұрай|admin|Астана|Corneli Astana Turan|Corneli|2080
2081|Шындаулет|Бексұлтан|online_manager|Астана|Corneli Astana Turan|Corneli|2081
2082|Мешитбаева|Арина|stylist|Астана|Corneli Astana Turan|Corneli|2082
2083|Тендік|Ажаргуль|stylist|Астана|Corneli Astana Turan|Corneli|2083
2084|Урумбасаров|Руслан|stylist|Астана|Corneli Astana Turan|Corneli|2084
2085|Романова|Зоя|director|Караганда|Crinzo Karaganda|Crinzo|2085
2086|Гузалова|Анастасия|stylist|Караганда|Crinzo Karaganda|Crinzo|2086
2087|Амирханова|Айнур|director|Астана|Corneli Astana Outlet|Corneli|2087
2088|Әбжанова|Асыл|online_manager|Астана|Corneli Astana Outlet|Corneli|2088
2089|Жайыкбаева|Меруерт|stylist|Астана|Corneli Astana Outlet|Corneli|2089
2090|Нурхожаева|Азиза|stylist|Астана|Corneli Astana Outlet|Corneli|2090
2091|Ордабеков|Алимжан|stylist|Астана|Corneli Astana Outlet|Corneli|2091
2092|Әбдіхан|Дана|director|Шымкент|Crinzo Shymkent Nursat|Crinzo|2092
2093|Абдикерим|Диас|admin|Шымкент|Crinzo Shymkent Nursat|Crinzo|2093
2094|Сейлхан|Жансая|online_manager|Шымкент|Crinzo Shymkent Nursat|Crinzo|2094
2095|Бетаева|Нұрай|stylist|Шымкент|Crinzo Shymkent Nursat|Crinzo|2095
2096|Білісбек|Айдана|stylist|Шымкент|Crinzo Shymkent Nursat|Crinzo|2096
2097|Дарын|Ақнұр|stylist|Шымкент|Crinzo Shymkent Nursat|Crinzo|2097
2098|Козяев|Виктор|director|Шымкент|Corneli Shymkent Grandpark|Corneli|2098
2099|Бесбаев|Ерсұлтан|stylist|Шымкент|Corneli Shymkent Grandpark|Corneli|2099
2100|Исахова|Әлия|stylist|Шымкент|Corneli Shymkent Grandpark|Corneli|2100
2101|Райымбек|Жансая|stylist|Шымкент|Corneli Shymkent Grandpark|Corneli|2101
2102|Қуаныш|Ұлбала|director|Шымкент|Corneli Shymkent Kunaeva|Corneli|2102
2103|Ильясқызы|Айсана|admin|Шымкент|Corneli Shymkent Kunaeva|Corneli|2103
2104|Умарназаров|Бахтияр|online_manager|Шымкент|Corneli Shymkent Kunaeva|Corneli|2104
2105|Алметова|Азиза|stylist|Шымкент|Corneli Shymkent Kunaeva|Corneli|2105
2106|Калан|Иманғали|stylist|Шымкент|Corneli Shymkent Kunaeva|Corneli|2106`;
export const CANONICAL_ROSTER = DATA.trim().split("\n").map(line => {
  const [id,surname,firstname,role,city,store,brand,pin] = line.split("|");
  return {id,surname,firstname,role,city,store,brand,pin};
});
