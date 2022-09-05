
/* ------------------------------------------------------------------
 * loca section
   ------------------------------------------------------------------ */

import { constants } from "@keymanapp/ldml-keyboard-constants";
import { KMXPlusData } from "../kmx-plus";
import { alloc_string, BUILDER_STRS } from "./build-strs";
import { BUILDER_SECTION } from "./builder-section";

/**
 * Builder for the 'loca' section
 */
export interface BUILDER_LOCA extends BUILDER_SECTION {
  count: number;
  reserved: number;
  items: number[]; //str[]
};

export function build_loca(kmxplus: KMXPlusData, sect_strs: BUILDER_STRS): BUILDER_LOCA {
  let loca: BUILDER_LOCA = {
    ident: constants.hex_section_id(constants.section.loca),
    size: constants.length_loca + constants.length_loca_item * kmxplus.loca.locales.length,
    _offset: 0,
    count: kmxplus.loca.locales.length,
    reserved: 0,
    items: []
  };

  for(let item of kmxplus.loca.locales) {
    loca.items.push(alloc_string(sect_strs, item));
  }

  return loca;
}

