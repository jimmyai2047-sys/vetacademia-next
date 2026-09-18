// Month-wise task calendar for North/Central India (English source;
// month names + tasks auto-translate via FarmText).

export type MonthRow = {
  month: string;
  tasks: string[];
};

export const FARM_CALENDAR: MonthRow[] = [
  {
    month: "January",
    tasks: [
      "Protect animals from cold — gunny curtains on shed, dry bedding",
      "Deworm all animals; give mineral mixture daily",
      "Sow berseem + mustard for green fodder",
    ],
  },
  {
    month: "February",
    tasks: [
      "FMD vaccination booster if due; check HS vaccine record",
      "Increase concentrate for late-pregnant animals",
      "Clean water tanks; repair shed before summer",
    ],
  },
  {
    month: "March",
    tasks: [
      "Prepare for heat — whitewash shed roof, arrange fans/coolers",
      "PPR vaccination for goats/sheep",
      "Sow summer fodder (cowpea, sorghum)",
    ],
  },
  {
    month: "April",
    tasks: [
      "Bathe buffaloes twice daily; give cool water 3–4 times",
      "Watch for heat stroke signs in poultry — add electrolytes",
      "Store dry fodder (wheat straw) for the year",
    ],
  },
  {
    month: "May",
    tasks: [
      "Peak loo season — never tie animals in open sun 12–3 pm",
      "Ranikhet R2B vaccine for poultry layers",
      "Repeat breeder check: confirm pregnancies by vet",
    ],
  },
  {
    month: "June",
    tasks: [
      "HS + BQ vaccination before monsoon (cattle/buffalo)",
      "Clean drains around shed; stock lime + phenyl",
      "Deworm before rains; trim hooves",
    ],
  },
  {
    month: "July",
    tasks: [
      "Monsoon care — keep shed floor dry, prevent foot rot",
      "Do not feed fungus-affected fodder; sun-dry before feeding",
      "Enterotoxemia vaccine for goats/sheep",
    ],
  },
  {
    month: "August",
    tasks: [
      "Watch for LSD/FMD spread; isolate new/sick animals",
      "Fly and mosquito control in shed",
      "Sow kharif fodder gaps (maize, bajra)",
    ],
  },
  {
    month: "September",
    tasks: [
      "Brucella-MG vaccination for female calves (4–8 months)",
      "Deworm again after rains; check skin diseases",
      "Plan rabi fodder: berseem, oats, mustard",
    ],
  },
  {
    month: "October",
    tasks: [
      "FMD annual vaccination round; update every animal's record",
      "Start night shelter against falling temperature",
      "Sell extra male kids/calves at good festival prices",
    ],
  },
  {
    month: "November",
    tasks: [
      "Increase energy feed as cold rises; give warm water",
      "PPR booster for flocks; poultry fowl-pox vaccine",
      "Weigh and record calves; cull unproductive birds",
    ],
  },
  {
    month: "December",
    tasks: [
      "Peak cold — close shed from 3 sides at night, no bath in cold wind",
      "Year-end accounts: milk, feed cost, profit per animal",
      "Renew Pashu Bima (insurance) policies before expiry",
    ],
  },
];
