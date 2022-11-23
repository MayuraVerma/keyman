
import { constants } from "@keymanapp/ldml-keyboard-constants";
import { KeyFlags, KMXPlusData } from "../kmx-plus.js";
import { build_strs_index, BUILDER_STRS } from "./build-strs.js";
import { BUILDER_SECTION } from "./builder-section.js";

/* ------------------------------------------------------------------
 * keys section
   ------------------------------------------------------------------ */


// interface BUILDER_KEY2_ITEM {
//   vkey: number;
//   mod: number;
//   to: number; //str or UTF-32 char depending on value of 'extend'
//   flags: number; //bitfield
// };

/**
 * Builder for the 'keys' section
 */
export interface BUILDER_KEY2 extends BUILDER_SECTION {
//   count: number;
//   reserved: number;
//   items: BUILDER_KEYS_ITEM[];
};


export function build_key2(kmxplus: KMXPlusData, sect_strs: BUILDER_STRS, sect_list: BUILDER_LIST): BUILDER_KEY2 {
  if(!kmxplus.keys.keys.length) {
    return null;
  }

  let key2: BUILDER_KEY2 = {
    // ident: constants.hex_section_id(constants.section.keys),
    // size: constants.length_keys + constants.length_keys_item * kmxplus.keys.keys.length,
    // _offset: 0,
    // count: kmxplus.keys.keys.length,
    // reserved: 0,
    // items: []
  };

//   for(let item of kmxplus.keys.keys) {
//     keys.items.push({
//       vkey: item.vkey,
//       mod: item.mod,
//       // todo: support 'extend'
//       to: build_strs_index(sect_strs, item.to),
//       flags: KeyFlags.extend // todo: support non-extended
//     });
//   }

  return key2;
}
