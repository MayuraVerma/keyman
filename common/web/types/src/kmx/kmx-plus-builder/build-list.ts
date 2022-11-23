import { constants } from "@keymanapp/ldml-keyboard-constants";
import { List, ListItem } from "../kmx-plus.js";
import { build_strs_index, BUILDER_STRS } from "./build-strs.js";
import { BUILDER_SECTION } from "./builder-section.js";

/* ------------------------------------------------------------------
 * list section
   ------------------------------------------------------------------ */

interface BUILDER_LIST_LIST {
  index: number; // index into indices
  count: number; // number of strings
  _value: ListItem; // for findability
};

interface BUILDER_LIST_INDEX {
  index: number; // str
  _value: string; // for findability?
};

/**
 * Builder for the 'list' section
 */
export interface BUILDER_LIST extends BUILDER_SECTION {
  listCount: number;
  indexCount: number;
  lists: BUILDER_LIST_LIST[];
  indices: BUILDER_LIST_INDEX[];
};

export function build_list(source_list: List, sect_strs: BUILDER_STRS): BUILDER_LIST {
  let result: BUILDER_LIST = {
    listCount: source_list.lists.length,
    indexCount: 0,
    lists: [],
    indices: [],
    ident: constants.hex_section_id(constants.section.list),
    size: 0,
    _offset: 0
  };

  result.lists = source_list.lists.map(array => {
    let list : BUILDER_LIST_LIST = {
      index: result.indices.length, // the next indexcount
      count: array.length,
      _value: array
    };
    array.forEach((i) => {
      let index : BUILDER_LIST_INDEX = {
        // Get the final string index
        index: build_strs_index(sect_strs, i.value),
        _value: i.value.value, // unwrap the actual string value
      };
      result.indices.push(index); // increment the indexCount
      result.indexCount++;
    });
    return list;
  });

  // Sort the lists.
  result.lists.sort((a,b) => a._value.compareTo(b._value));

  let offset = constants.length_list +
    (constants.length_list_item * result.listCount) +
    (constants.length_list_index * result.indexCount);
  result.size = offset;

  return result;
}

/**
 * Returns the index into the list, analagous to build_strs_index
 * @param sect_strs
 * @param value
 * @returns
 */
export function build_list_index(sect_list: BUILDER_LIST, value: ListItem) {
  if(!(value instanceof ListItem)) {
    throw new Error('unexpected value '+ value);
  }

  let result = sect_list.lists.findIndex(v => v._value === value);
  if(result < 0) {
    throw new Error('unexpectedly missing ListItem ' + value); // TODO-LDML: it's an array of strs
  }
  return result;
}
