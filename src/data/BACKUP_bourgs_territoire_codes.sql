-- BACKUP des territoire_codes de la table bourgs
-- Date: 2026-02-15
-- IMPORTANT: À réappliquer après toute mise à jour de la table bourgs

-- Artistique (9e, 18e)
UPDATE bourgs SET territoire_codes = '{"arrondissements": [9, 18]}'::jsonb WHERE id = 'artistique';

-- Belleville (20e)
UPDATE bourgs SET territoire_codes = '{"arrondissements": [20]}'::jsonb WHERE id = 'belleville';

-- Boucle Sud-Ouest (18 communes)
UPDATE bourgs SET territoire_codes = '{"communes": ["92012", "92026", "92040", "92046", "92049", "92063", "92064", "92073", "92075", "94028", "94037", "94041", "94052", "94053", "94054", "94055", "94077", "92023"]}'::jsonb WHERE id = 'boucle-sud-ouest';

-- Central (1er, 3e, 4e, 6e)
UPDATE bourgs SET territoire_codes = '{"arrondissements": [1, 3, 4, 6]}'::jsonb WHERE id = 'central';

-- Deuxième (2e)
UPDATE bourgs SET territoire_codes = '{"arrondissements": [2]}'::jsonb WHERE id = 'deuxieme';

-- Forêts Périphériques (Bois de Boulogne, Bois de Vincennes)
UPDATE bourgs SET territoire_codes = '{}'::jsonb WHERE id = 'forets-peripheriques';

-- Grand Paris Sud (34 communes)
UPDATE bourgs SET territoire_codes = '{"communes": ["91027", "91057", "91103", "91223", "91228", "91286", "91312", "91326", "91377", "91390", "91425", "91457", "91471", "91479", "91521", "91589", "91661", "91687", "91692", "94002", "94011", "94016", "94017", "94018", "94019", "94021", "94022", "94033", "94034", "94044", "94067", "94069", "94073", "94074"]}'::jsonb WHERE id = 'grand-paris-sud';

-- La Défense (2 communes + Nanterre)
UPDATE bourgs SET territoire_codes = '{"communes": ["92009", "92050"]}'::jsonb WHERE id = 'la-defense';

-- Latin (5e)
UPDATE bourgs SET territoire_codes = '{"arrondissements": [5]}'::jsonb WHERE id = 'latin';

-- Marne-la-Vallée (75 communes - Seine-et-Marne + Seine-Saint-Denis + Val-de-Marne)
UPDATE bourgs SET territoire_codes = '{"communes": ["77018", "77047", "77049", "77058", "77059", "77062", "77075", "77083", "77085", "77111", "77114", "77121", "77124", "77125", "77128", "77130", "77132", "77141", "77142", "77155", "77169", "77171", "77177", "77180", "77181", "77209", "77215", "77221", "77225", "77234", "77237", "77243", "77248", "77249", "77268", "77307", "77315", "77350", "77372", "77373", "77374", "77382", "77390", "77408", "77413", "77438", "77443", "77449", "77450", "77464", "77466", "77468", "77470", "77484", "77505", "77508", "77510", "77521", "77529", "93033", "93049", "93050", "93051", "93064", "93077", "94015", "94017", "94019", "94052", "94053", "94055", "94058", "94059", "94060", "94079"]}'::jsonb WHERE id = 'marne-la-vallee';

-- Montparnasse (14e)
UPDATE bourgs SET territoire_codes = '{"arrondissements": [14]}'::jsonb WHERE id = 'montparnasse';

-- Nord-Est (22 communes - sans 93077 qui est dans Marne-la-Vallée)
UPDATE bourgs SET territoire_codes = '{"communes": ["93005", "93007", "93008", "93010", "93013", "93014", "93015", "93029", "93030", "93032", "93045", "93046", "93047", "93055", "93057", "93061", "93062", "93063", "93071", "93073", "93074", "93078"]}'::jsonb WHERE id = 'nord-est';

-- Ouest (15 communes + 15e, 16e, 17e)
UPDATE bourgs SET territoire_codes = '{"arrondissements": [15, 16, 17], "communes": ["92002", "92004", "92007", "92014", "92019", "92022", "92024", "92025", "92032", "92035", "92044", "92051", "92062", "92072", "92036"]}'::jsonb WHERE id = 'ouest';

-- Pouvoir (7e, 8e)
UPDATE bourgs SET territoire_codes = '{"arrondissements": [7, 8]}'::jsonb WHERE id = 'pouvoir';

-- Révolutionnaire (10e, 11e, 12e, 19e)
UPDATE bourgs SET territoire_codes = '{"arrondissements": [10, 11, 12, 19]}'::jsonb WHERE id = 'revolutionnaire';

-- Saint-Denis (11 communes)
UPDATE bourgs SET territoire_codes = '{"communes": ["93001", "93006", "93027", "93031", "93039", "93048", "93053", "93059", "93066", "93072", "93070"]}'::jsonb WHERE id = 'saint-denis';

-- Triangle du 13e (13e)
UPDATE bourgs SET territoire_codes = '{"arrondissements": [13]}'::jsonb WHERE id = 'triangle';

-- Val-de-Marne Est (12 communes)
UPDATE bourgs SET territoire_codes = '{"communes": ["94015", "94017", "94018", "94033", "94034", "94043", "94044", "94046", "94058", "94069", "94071", "94076"]}'::jsonb WHERE id = 'val-de-marne-est';

-- Versailles (2 communes)
UPDATE bourgs SET territoire_codes = '{"communes": ["78646", "78551"]}'::jsonb WHERE id = 'versailles';

-- Bourgs sans polygones (souterrains, zones indéfinies)
UPDATE bourgs SET territoire_codes = '{}'::jsonb WHERE id = 'dessous-rive-droite';
UPDATE bourgs SET territoire_codes = '{}'::jsonb WHERE id = 'dessous-rive-gauche';
UPDATE bourgs SET territoire_codes = '{}'::jsonb WHERE id = 'yvelines-essonne';

