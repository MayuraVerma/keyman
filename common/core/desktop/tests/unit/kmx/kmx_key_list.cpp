/*
  Copyright:    © 2018 SIL International.
  Description:  Tests for key rules list generation in the kmx processor
  Create Date:  30 Oct 2018
  Authors:      Ross Cruickshank (RC) Marc Durdin (MD), Tim Eves (TSE)

*/

#include <kmx/kmx_processevent.h>

#include "path.hpp"
#include "state.hpp"

#include "../test_assert.h"
#include "../test_color.h"

using namespace km::kbp::kmx;

km_kbp_option_item test_env_opts[] =
{
  KM_KBP_OPTIONS_END
};

int error_args() {
    std::cerr << "kmx: Not enough arguments." << std::endl;
    return 1;
}

#define NO_MODIFIER_FLAGS 0
#define CHAR_CODE_LOWER_A 97
#define CHAR_CODE_LOWER_B 98

km_kbp_keyboard_key kb_key_expected_list[] = {{KM_KBP_VKEY_1, KM_KBP_MODIFIER_VIRTUALKEY},
                                              {KM_KBP_VKEY_2, KM_KBP_MODIFIER_VIRTUALKEY},
                                              {KM_KBP_VKEY_B, (KM_KBP_MODIFIER_VIRTUALKEY | KM_KBP_MODIFIER_CTRL )},
                                              {KM_KBP_VKEY_C, KM_KBP_MODIFIER_VIRTUALKEY},
                                              {KM_KBP_VKEY_C, (KM_KBP_MODIFIER_VIRTUALKEY | KM_KBP_MODIFIER_ALT )},
                                              {CHAR_CODE_LOWER_A, NO_MODIFIER_FLAGS},
                                              {CHAR_CODE_LOWER_B, NO_MODIFIER_FLAGS}};



/**
 * The purpose of this test is to verify that `km_kbp_keyboard_get_key_list`
 * returns list of all the keys used for a keyboard that core as loaded.
 *
 * @param source_file  Path to kmx keyboard file
 */
void test_key_list(const km::kbp::path &source_file){

  km_kbp_keyboard * test_kb = nullptr;
  km_kbp_state * test_state = nullptr;
  km_kbp_keyboard_key * kb_key_list;

  km::kbp::path full_path = source_file;

  try_status(km_kbp_keyboard_load(full_path.native().c_str(), &test_kb));

  // Setup state, environment
  try_status(km_kbp_state_create(test_kb, test_env_opts, &test_state));

  try_status(km_kbp_keyboard_get_key_list(test_kb,&kb_key_list));

  km_kbp_keyboard_key *key_rule_it = kb_key_list;
  auto n = 0;
  for (; key_rule_it->key; ++key_rule_it) {
    assert(kb_key_expected_list[n].key == key_rule_it->key);
    assert(kb_key_expected_list[n].modifier_flag == key_rule_it->modifier_flag);
    ++n;
  }
  assert(n==7);

  km_kbp_keyboard_key_list_dispose(kb_key_list);
  km_kbp_state_dispose(test_state);
  km_kbp_keyboard_dispose(test_kb);

}

int main(int argc, char *argv []) {
  int first_arg = 1;

  if (argc < 2) {
    return error_args();
  }

  auto arg_color = std::string(argv[1]) == "--color";
  if(arg_color) {
    first_arg++;
    if(argc < 3) {
      return error_args();
    }
  }
  console_color::enabled = console_color::isaterminal() || arg_color;

  test_key_list(argv[first_arg]);

  return 0;
}
