export interface AfricanCountry {
  name: string;
  capital: string;
  code: string;
  cities: string[];
}

export const AFRICAN_COUNTRIES: AfricanCountry[] = [
  { name: 'Afrique du Sud', capital: 'Pretoria', code: '+27', cities: ['Johannesburg', 'Le Cap', 'Durban', 'Pretoria', 'Port Elizabeth', 'Soweto', 'Bloemfontein', 'East London', 'Kimberley', 'Polokwane'] },
  { name: 'Algérie', capital: 'Alger', code: '+213', cities: ['Alger', 'Oran', 'Constantine', 'Annaba', 'Blida', 'Sétif', 'Tlemcen', 'Batna', 'Béjaïa', 'Biskra'] },
  { name: 'Angola', capital: 'Luanda', code: '+244', cities: ['Luanda', 'Huambo', 'Lobito', 'Benguela', 'Lubango', 'Malanje', 'Cabinda', 'Uíge', 'Kuito', 'Namibe'] },
  { name: 'Bénin', capital: 'Porto-Novo', code: '+229', cities: ['Cotonou', 'Porto-Novo', 'Parakou', 'Djougou', 'Abomey', 'Natitingou', 'Bohicon', 'Lokossa', 'Ouidah', 'Kandi'] },
  { name: 'Botswana', capital: 'Gaborone', code: '+267', cities: ['Gaborone', 'Francistown', 'Molepolole', 'Maun', 'Selebi-Phikwe', 'Serowe', 'Mahalapye', 'Kanye', 'Mochudi', 'Kasane'] },
  { name: 'Burkina Faso', capital: 'Ouagadougou', code: '+226', cities: ['Ouagadougou', 'Bobo-Dioulasso', 'Koudougou', 'Ouahigouya', 'Banfora', "Fada N'Gourma", 'Dédougou', 'Tenkodogo', 'Kaya', 'Dori'] },
  { name: 'Burundi', capital: 'Gitega', code: '+257', cities: ['Bujumbura', 'Gitega', 'Ngozi', 'Muyinga', 'Ruyigi', 'Kayanza', 'Makamba', 'Bururi', 'Cibitoke', 'Rumonge'] },
  { name: 'Cameroun', capital: 'Yaoundé', code: '+237', cities: ['Douala', 'Yaoundé', 'Garoua', 'Maroua', 'Bafoussam', 'Bamenda', 'Ngaoundéré', 'Kumba', 'Ebolowa', 'Bertoua'] },
  { name: 'Cap-Vert', capital: 'Praia', code: '+238', cities: ['Praia', 'Mindelo', 'Santa Maria', 'Assomada', 'Espargos', 'Tarrafal', 'Sal Rei', 'Ribeira Grande', 'Porto Novo', 'São Filipe'] },
  { name: 'Comores', capital: 'Moroni', code: '+269', cities: ['Moroni', 'Moutsamoudou', 'Fomboni', 'Domoni', 'Mitsamiouli', 'Ouani', 'Sima', 'Iconi', 'Mbéni', 'Tsémbehou'] },
  { name: 'Congo (Brazzaville)', capital: 'Brazzaville', code: '+242', cities: ['Brazzaville', 'Pointe-Noire', 'Dolisie', 'Nkayi', 'Ouesso', 'Madingou', 'Owando', 'Gamboma', 'Impfondo', 'Sibiti'] },
  { name: 'Côte d\'Ivoire', capital: 'Yamoussoukro', code: '+225', cities: ['Abidjan', 'Yamoussoukro', 'Bouaké', 'Daloa', 'San-Pédro', 'Korhogo', 'Man', 'Gagnoa', 'Abengourou', 'Grand-Bassam'] },
  { name: 'Djibouti', capital: 'Djibouti', code: '+253', cities: ['Djibouti', 'Ali Sabieh', 'Tadjourah', 'Arta', 'Dikhil', 'Obock', 'Holhol', 'Doraleh', 'Yoboki', 'Galafi'] },
  { name: 'Égypte', capital: 'Le Caire', code: '+20', cities: ['Le Caire', 'Alexandrie', 'Gizeh', 'Louxor', 'Assouan', 'Port-Saïd', 'Suez', 'Mansourah', 'Tanta', 'Hurghada', 'Charm el-Cheikh'] },
  { name: 'Érythrée', capital: 'Asmara', code: '+291', cities: ['Asmara', 'Massaoua', 'Keren', 'Assab', 'Mendefera', 'Barentu', 'Adi Keyh', 'Dekemhare', 'Teseney', "Ak'ordat"] },
  { name: 'Eswatini', capital: 'Mbabane', code: '+268', cities: ['Manzini', 'Mbabane', 'Lobamba', 'Nhlangano', 'Siteki', 'Big Bend', 'Malkerns', 'Piggs Peak', 'Hluti', 'Lavumisa'] },
  { name: 'Éthiopie', capital: 'Addis-Abeba', code: '+251', cities: ['Addis-Abeba', 'Dire Dawa', 'Mekele', 'Adama', 'Gondar', 'Baher Dar', 'Jimma', 'Harar', 'Awasa', 'Dessie'] },
  { name: 'Gabon', capital: 'Libreville', code: '+241', cities: ['Libreville', 'Port-Gentil', 'Franceville', 'Oyem', 'Moanda', 'Lambaréné', 'Mouila', 'Tchibanga', 'Makokou', 'Koulamoutou'] },
  { name: 'Gambie', capital: 'Banjul', code: '+220', cities: ['Banjul', 'Serrekunda', 'Brikama', 'Bakau', 'Farafenni', 'Lamin', 'Basse Santa Su', 'Gunjur', 'Soma', 'Janjanbureh'] },
  { name: 'Ghana', capital: 'Accra', code: '+233', cities: ['Accra', 'Kumasi', 'Tamale', 'Sekondi-Takoradi', 'Tema', 'Cape Coast', 'Obuasi', 'Sunyani', 'Ho', 'Koforidua'] },
  { name: 'Guinée', capital: 'Conakry', code: '+224', cities: ['Conakry', 'Nzérékoré', 'Kankan', 'Kindia', 'Labé', 'Mamou', 'Kissidougou', 'Guéckédou', 'Faranah', 'Siguiri'] },
  { name: 'Guinée-Bissau', capital: 'Bissau', code: '+245', cities: ['Bissau', 'Gabu', 'Bafatá', 'Cacheu', 'Farim', 'Bissorã', 'Bolama', 'Catió', 'Bubaque', 'Mansoa'] },
  { name: 'Guinée équatoriale', capital: 'Malabo', code: '+240', cities: ['Malabo', 'Bata', 'Ebebiyín', 'Evinayong', 'Mongomo', 'Luba', 'Mbini', 'Aconibe', 'Mikomeseng', 'Añisoc'] },
  { name: 'Kenya', capital: 'Nairobi', code: '+254', cities: ['Nairobi', 'Mombasa', 'Kisumu', 'Nakuru', 'Eldoret', 'Thika', 'Nyeri', 'Malindi', 'Lamu', 'Naivasha'] },
  { name: 'Lesotho', capital: 'Maseru', code: '+266', cities: ['Maseru', 'Teyateyaneng', 'Mafeteng', 'Leribe', "Mohale's Hoek", 'Quthing', 'Butha-Buthe', 'Thaba-Tseka', 'Mokhotlong', "Qacha's Nek"] },
  { name: 'Liberia', capital: 'Monrovia', code: '+231', cities: ['Monrovia', 'Gbarnga', 'Buchanan', 'Kakata', 'Harper', 'Zwedru', 'Voinjama', 'Robertsport', 'Sanniquellie', 'Greenville'] },
  { name: 'Libye', capital: 'Tripoli', code: '+218', cities: ['Tripoli', 'Benghazi', 'Misrata', 'Zliten', 'Al Khoms', 'Tobrouk', 'Sebha', 'Syrte', 'Mourzouq', 'Ghat'] },
  { name: 'Madagascar', capital: 'Antananarivo', code: '+261', cities: ['Antananarivo', 'Toamasina', 'Antsirabe', 'Mahajanga', 'Fianarantsoa', 'Toliara', 'Antsiranana', 'Nosy Be', 'Morondava', 'Fort Dauphin'] },
  { name: 'Malawi', capital: 'Lilongwe', code: '+265', cities: ['Lilongwe', 'Blantyre', 'Mzuzu', 'Zomba', 'Kasungu', 'Mangochi', 'Karonga', 'Salima', 'Nkhotakota', 'Liwonde'] },
  { name: 'Mali', capital: 'Bamako', code: '+223', cities: ['Bamako', 'Sikasso', 'Mopti', 'Ségou', 'Gao', 'Kayes', 'Tombouctou', 'Kidal', 'Koulikoro', 'Djenné'] },
  { name: 'Maroc', capital: 'Rabat', code: '+212', cities: ['Casablanca', 'Rabat', 'Marrakech', 'Fès', 'Tanger', 'Agadir', 'Oujda', 'Meknès', 'Essaouira', 'Ouarzazate'] },
  { name: 'Maurice', capital: 'Port-Louis', code: '+230', cities: ['Port-Louis', 'Curepipe', 'Quatre Bornes', 'Vacoas-Phoenix', 'Beau Bassin-Rose Hill', 'Grand Baie', 'Mahébourg', 'Flic-en-Flac', 'Bel Air', 'Tamarin'] },
  { name: 'Mauritanie', capital: 'Nouakchott', code: '+222', cities: ['Nouakchott', 'Nouadhibou', 'Kiffa', 'Rosso', 'Atar', 'Kaédi', 'Zouerate', 'Aleg', 'Tidjikja', 'Chinguetti'] },
  { name: 'Mozambique', capital: 'Maputo', code: '+258', cities: ['Maputo', 'Beira', 'Nampula', 'Quelimane', 'Nacala', 'Tete', 'Pemba', 'Inhambane', 'Xai-Xai', 'Chimoio'] },
  { name: 'Namibie', capital: 'Windhoek', code: '+264', cities: ['Windhoek', 'Swakopmund', 'Walvis Bay', 'Oshakati', 'Katima Mulilo', 'Lüderitz', 'Tsumeb', 'Otjiwarongo', 'Keetmanshoop', 'Rundu'] },
  { name: 'Niger', capital: 'Niamey', code: '+227', cities: ['Niamey', 'Zinder', 'Maradi', 'Agadez', 'Tahoua', 'Dosso', 'Diffa', 'Tillabéri', 'Arlit', "Birni N'Konni"] },
  { name: 'Nigeria', capital: 'Abuja', code: '+234', cities: ['Lagos', 'Abuja', 'Kano', 'Port Harcourt', 'Ibadan', 'Kaduna', 'Benin City', 'Enugu', 'Onitsha', 'Jos', 'Maiduguri', 'Calabar'] },
  { name: 'Ouganda', capital: 'Kampala', code: '+256', cities: ['Kampala', 'Entebbe', 'Jinja', 'Gulu', 'Mbarara', 'Mbale', 'Lira', 'Fort Portal', 'Masaka', 'Arua'] },
  { name: 'RDC', capital: 'Kinshasa', code: '+243', cities: ['Kinshasa', 'Lubumbashi', 'Goma', 'Mbuji-Mayi', 'Kisangani', 'Bukavu', 'Kananga', 'Matadi', 'Kolwezi', 'Bandundu', 'Kindu', 'Butembo', 'Uvira', 'Kalemie', 'Tshikapa'] },
  { name: 'Rwanda', capital: 'Kigali', code: '+250', cities: ['Kigali', 'Butare', 'Gitarama', 'Musanze', 'Gisenyi', 'Nyagatare', 'Cyangugu', 'Kibuye', 'Rwamagana', 'Muhanga'] },
  { name: 'Sao Tomé-et-Principe', capital: 'São Tomé', code: '+239', cities: ['São Tomé', 'Santo António', 'Trindade', 'Neves', 'Santana', 'Angolares', 'Guadalupe', 'São João dos Angolares', 'Ribeira Afonso', 'Pantufo'] },
  { name: 'Sénégal', capital: 'Dakar', code: '+221', cities: ['Dakar', 'Thiès', 'Saint-Louis', 'Touba', 'Kaolack', 'Ziguinchor', 'Mbour', 'Diourbel', 'Tambacounda', 'Louga'] },
  { name: 'Seychelles', capital: 'Victoria', code: '+248', cities: ['Victoria', 'Anse Royale', 'Beau Vallon', 'Anse aux Pins', 'Takamaka', 'Grand Anse Mahé', 'La Passe', 'Baie Sainte Anne', 'Anse Boileau', 'Glacis'] },
  { name: 'Sierra Leone', capital: 'Freetown', code: '+232', cities: ['Freetown', 'Bo', 'Kenema', 'Makeni', 'Koidu', 'Lunsar', 'Port Loko', 'Magburaka', 'Kabala', 'Moyamba'] },
  { name: 'Somalie', capital: 'Mogadiscio', code: '+252', cities: ['Mogadiscio', 'Hargeisa', 'Bosasso', 'Kismayo', 'Baidoa', 'Merca', 'Berbera', 'Beledweyne', 'Garowe', 'Galcaio'] },
  { name: 'Soudan', capital: 'Khartoum', code: '+249', cities: ['Khartoum', 'Omdurman', 'Port-Soudan', 'Kassala', 'Nyala', 'Al-Ubayyid', 'Wad Madani', 'El Fasher', 'Gedaref', 'Atbara'] },
  { name: 'Soudan du Sud', capital: 'Djouba', code: '+211', cities: ['Djouba', 'Malakal', 'Wau', 'Yambio', 'Rumbek', 'Bor', 'Torit', 'Yei', 'Aweil', 'Bentiu'] },
  { name: 'Tanzanie', capital: 'Dodoma', code: '+255', cities: ['Dar es Salam', 'Dodoma', 'Arusha', 'Mwanza', 'Zanzibar', 'Mbeya', 'Tanga', 'Morogoro', 'Kigoma', 'Moshi'] },
  { name: 'Tchad', capital: "N'Djaména", code: '+235', cities: ["N'Djaména", 'Moundou', 'Sarh', 'Abéché', 'Kélo', 'Am Timan', 'Doba', 'Pala', 'Faya-Largeau', 'Bol'] },
  { name: 'Togo', capital: 'Lomé', code: '+228', cities: ['Lomé', 'Sokodé', 'Kara', 'Kpalimé', 'Atakpamé', 'Dapaong', 'Tsévié', 'Bassar', 'Notsé', 'Aného'] },
  { name: 'Tunisie', capital: 'Tunis', code: '+216', cities: ['Tunis', 'Sfax', 'Sousse', 'Bizerte', 'Kairouan', 'Gabès', 'Nabeul', 'Monastir', 'Tozeur', 'Djerba'] },
  { name: 'Zambie', capital: 'Lusaka', code: '+260', cities: ['Lusaka', 'Kitwe', 'Ndola', 'Livingstone', 'Kabwe', 'Chingola', 'Chipata', 'Solwezi', 'Kasama', 'Mongu'] },
  { name: 'Zimbabwe', capital: 'Harare', code: '+263', cities: ['Harare', 'Bulawayo', 'Mutare', 'Gweru', 'Masvingo', 'Chinhoyi', 'Kwekwe', 'Victoria Falls', 'Kadoma', 'Marondera'] },
];

export function getCountryByCode(code: string): AfricanCountry | undefined {
  return AFRICAN_COUNTRIES.find((c) => c.code === code);
}

export function getCountryByName(name: string): AfricanCountry | undefined {
  return AFRICAN_COUNTRIES.find((c) => c.name === name);
}

export function getCitiesByCountry(countryName: string): string[] {
  const country = getCountryByName(countryName);
  return country ? country.cities : [];
}
