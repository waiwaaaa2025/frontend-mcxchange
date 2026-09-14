// The 30 FMCSA cargo classifications, spelled exactly as the carrier-data API
// returns them. Offered as suggestions on the Lead Generator cargo filter; the
// server matches case-insensitive substrings, including "Other" descriptions.
export const CARGO_TYPES = [
  'General Freight', 'Household Goods', 'Metal/Sheets/Coils', 'Motor Vehicles', 'Drive/Tow Away',
  'Logs/Poles/Lumber', 'Building Materials', 'Mobile Homes', 'Machinery/Large Objects',
  'Fresh/Frozen Foods', 'Liquids/Gases', 'Intermodal Containers', 'Passengers', 'Oilfield Equipment',
  'Livestock', 'Grain/Feed/Hay', 'Coal/Coke', 'Meat', 'Garbage/Refuse', 'US Mail', 'Chemicals',
  'Commodities/Dry Bulk', 'Beverages', 'Paper Products', 'Utilities', 'Farm Supplies', 'Construction',
  'Water Well', 'Produce', 'Other',
]
