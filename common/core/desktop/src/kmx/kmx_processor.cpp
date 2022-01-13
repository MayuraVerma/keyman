#include <keyman/keyboardprocessor.h>
#include "state.hpp"
#include "kmx/kmx_processor.hpp"
#include <map>

using namespace km::kbp;
using namespace kmx;

// TODO consolodate with appint.cpp and put in public library.
static KMX_BOOL ContextItemsFromAppContext(KMX_WCHAR const* buf, km_kbp_context_item** outPtr)
{
  assert(buf);
  assert(outPtr);
  km_kbp_context_item* context_items  = new km_kbp_context_item[u16len(buf) + 1];
  KMX_WCHAR const *p = buf;
  uint8_t contextIndex = 0;
  while (*p) {
    if (*p == UC_SENTINEL) {
      assert(*(p + 1) == CODE_DEADKEY);
      // we know the only uc_sentinel code in the context is code_deadkey, which has only 1 parameter: uc_sentinel code_deadkey <deadkey_id>
      // setup dead key context item
      p += 2;
      context_items[contextIndex++] = km_kbp_context_item{ KM_KBP_CT_MARKER, {0,}, {*p} };
    } else if (Uni_IsSurrogate1(*p) && Uni_IsSurrogate2(*(p + 1))) {
      // handle surrogate
      context_items[contextIndex++] = km_kbp_context_item{ KM_KBP_CT_CHAR, {0,}, {(char32_t)Uni_SurrogateToUTF32(*p, *(p + 1))} };
      p++;
    } else {
      context_items[contextIndex++] = km_kbp_context_item{ KM_KBP_CT_CHAR, {0,}, {*p} };
    }
    p++;
  }
  // terminate the context_items array.
  context_items[contextIndex] = km_kbp_context_item KM_KBP_CONTEXT_ITEM_END;

  *outPtr = context_items;
  return true;
}

km_kbp_status kmx_processor::validate() const {
  return _valid ? KM_KBP_STATUS_OK : KM_KBP_STATUS_INVALID_KEYBOARD;
}

kmx_processor::kmx_processor(kbp::path p) {
  p.replace_extension(".kmx");
  _valid = bool(_kmx.Load(p.c_str()));

  if (!_valid)
    return;

  keyboard_attributes::options_store defaults;
  _kmx.GetOptions()->Init(defaults);

  for (auto const & opt: defaults)
  {
    if (!opt.empty() && opt.scope == KM_KBP_OPT_KEYBOARD  )
      persisted_store()[opt.key] = opt.value;
  }
  // Fill out attributes
  auto v = _kmx.GetKeyboard()->Keyboard->version;
  auto vs = std::to_string(v >> 16) + "." + std::to_string(v & 0xffff);

  _attributes = keyboard_attributes(static_cast<std::u16string>(p.stem()),
                  std::u16string(vs.begin(), vs.end()), p.parent(), defaults);
}

char16_t const *
kmx_processor::lookup_option(
  km_kbp_option_scope scope,
  std::u16string const &key
) const {
  char16_t const *pValue = nullptr;
  switch (scope) {
  case KM_KBP_OPT_KEYBOARD:
    pValue = _kmx.GetOptions()->LookUp(key);
    break;
  case KM_KBP_OPT_ENVIRONMENT:
    pValue = _kmx.GetEnvironment()->LookUp(key);
    break;
  default:
    break;
  }

  return pValue ? pValue : nullptr;
}

option
kmx_processor::update_option(
  km_kbp_option_scope scope,
  std::u16string const &key,
  std::u16string const &value
) {
  switch (scope) {
  case KM_KBP_OPT_KEYBOARD:
    _kmx.GetOptions()->Set(key, value);
    persisted_store()[key] = value;
    break;
  case KM_KBP_OPT_ENVIRONMENT:
    _kmx.GetEnvironment()->Set(key, value);
    break;
  default:
    return option();
    break;
  }

  return option(scope, key, value);
}

bool
kmx_processor::queue_action(km_kbp_action_item const * action_item
) {
   DebugLog("Action type is [%d].\n", action_item->type);
  switch (action_item->type) {
  case KM_KBP_IT_END:
    // error should not queue empty item
    return false;
    break;
  case KM_KBP_IT_CHAR:
   _kmx.GetActions()->QueueAction(QIT_CHAR, action_item->character);
    break;
  case KM_KBP_IT_MARKER:
   _kmx.GetActions()->QueueAction(QIT_DEADKEY, (KMX_DWORD)action_item->marker);
    break;
  case KM_KBP_IT_ALERT:
    _kmx.GetActions()->QueueAction(QIT_BELL, 0);
    break;
  case KM_KBP_IT_BACK:
  {
    // If the context is already empty, we want to emit the backspace for application to use
    PKMX_WCHAR p_last_item_context = _kmx.GetContext()->Buf(1);

    if(!p_last_item_context || *p_last_item_context == 0)   {
      _kmx.GetActions()->QueueAction(QIT_INVALIDATECONTEXT, 0);
      // this method(queue_action) could be called outside the processing of a key
      // stroke, so it cannot set emit keystroke. Synthasize instead;
      // Currently    QIT_VKEYDOWN QIT_VKEYUP QIT_VSHIFTDOWN UP are not implmented
      //in the core KM_KBP actions therefore we can not synthasize.
      // For this Backspace case the Core is going to have to relax the
      // no QIT_BACK on a empty context. for now.
      //_kmx.GetActions()->QueueAction(QIT_VKEYDOWN, KM_KBP_VKEY_BKSP);
      //_kmx.GetActions()->QueueAction(QIT_VKEYUP, KM_KBP_VKEY_BKSP);

      // if we can synthasize backspace remove this QueAction back
      _kmx.GetActions()->QueueAction(QIT_BACK, BK_DEFAULT);
    } else if (action_item->backspace.expected_type == KM_KBP_BT_MARKER) {
      _kmx.GetActions()->QueueAction(QIT_BACK, BK_DEADKEY);
    } else /* KM_KBP_BT_CHAR, KM_KBP_BT_UNKNOWN */ {
      _kmx.GetActions()->QueueAction(QIT_BACK, BK_DEFAULT);
    }
    break;
  }
  case KM_KBP_IT_PERSIST_OPT:
  case KM_KBP_IT_EMIT_KEYSTROKE:
  case KM_KBP_IT_CAPSLOCK:
    // Not implemented TODO log message?
    return false;
    break;
  case KM_KBP_IT_INVALIDATE_CONTEXT:
    _kmx.GetActions()->QueueAction(QIT_INVALIDATECONTEXT, 0);
    break;
  }
  return true;
}

km_kbp_status
kmx_processor::process_event(
  km_kbp_state *state,
  km_kbp_virtual_key vk,
  uint16_t modifier_state,
  uint8_t is_key_down
) {
  // If the Virtual Key is VK_SPACE and the internal kmx processor has actions
  // then process that and return. These actions must have been added externally
  // via the queue_action method.
  bool has_internal_actions = ((vk == VK_SPACE) && (!_kmx.GetActions()->IsQueueEmpty()));

  if (!has_internal_actions){
    // Construct a context buffer from the items
    std::u16string ctxt;
    auto cp = state->context();
    for (auto c = cp.begin(); c != cp.end(); c++) {
      switch (c->type) {
      case KM_KBP_CT_CHAR:
        if (Uni_IsSMP(c->character)) {
          ctxt += Uni_UTF32ToSurrogate1(c->character);
          ctxt += Uni_UTF32ToSurrogate2(c->character);
        } else {
          ctxt += (km_kbp_cp)c->character;
        }
        break;
      case KM_KBP_CT_MARKER:
        assert(c->marker > 0);
        ctxt += UC_SENTINEL;
        ctxt += CODE_DEADKEY;
        ctxt += c->marker;
        break;
      }
    }

    _kmx.GetContext()->Set(ctxt.c_str());
    _kmx.GetActions()->ResetQueue();
    state->actions().clear();

    if (!_kmx.ProcessEvent(state, vk, modifier_state, is_key_down)) {
      // We need to output the default keystroke
      state->actions().push_emit_keystroke();
    }
  } else{
    state->actions().clear();
  }

  for (auto i = 0; i < _kmx.GetActions()->Length(); i++) {
    auto a = _kmx.GetActions()->Get(i);
    switch (a.ItemType) {
    case QIT_CAPSLOCK:
      state->actions().push_capslock(a.dwData);
      break;
    case QIT_VKEYDOWN:
    case QIT_VKEYUP:
    case QIT_VSHIFTDOWN:
    case QIT_VSHIFTUP:
      // TODO: eliminate??
      break;
    case QIT_CHAR:
      state->context().push_character(a.dwData);
      state->actions().push_character(a.dwData);
      break;
    case QIT_DEADKEY:
      state->context().push_marker(a.dwData);
      state->actions().push_marker(a.dwData);
      break;
    case QIT_BELL:
      state->actions().push_alert();
      break;
    case QIT_BACK:
      switch (a.dwData) {
      case BK_DEFAULT:
        // This only happens if we know we have context to delete. Last item must be a character

        // TODO: #5060 If we added a new action to core actions then we
        // can assert on backspace for a empty context.
        //assert(!state->context().empty());
        assert(state->context().back().type != KM_KBP_IT_MARKER);
        if(!state->context().empty()) {
          auto item = state->context().back();
          state->context().pop_back();
          state->actions().push_backspace(KM_KBP_BT_CHAR, item.character);
        } else {
          // Note: only runs on non-debug build, fail safe
          state->actions().push_backspace(KM_KBP_BT_UNKNOWN);
        }
        break;
      case BK_DEADKEY:
        // This only happens if we know we have context to delete. Last item must be a deadkey
        assert(!state->context().empty());
        assert(state->context().back().type == KM_KBP_IT_MARKER);
        if(!state->context().empty()) {
          auto item = state->context().back();
          state->context().pop_back();
          state->actions().push_backspace(KM_KBP_BT_MARKER, item.marker);
        } else {
          // Note: only runs on non-debug build, fail safe
          state->actions().push_backspace(KM_KBP_BT_UNKNOWN);
        }
        break;
      default:
        assert(false);
      }
      break;
    case QIT_INVALIDATECONTEXT:
      state->actions().push_invalidate_context();
      break;
    default:
      // std::cout << "Unexpected item type " << a.ItemType << ", " << a.dwData << std::endl;
      assert(false);
    }
  }

  state->actions().commit();
  // Queue should be cleared to allow testing if external actions have
  // been added to the keyboard action queue (currently IMX interaction)
  _kmx.GetActions()->ResetQueue();
  return KM_KBP_STATUS_OK;
}

constexpr km_kbp_attr const engine_attrs = {
  256,
  KM_KBP_LIB_CURRENT,
  KM_KBP_LIB_AGE,
  KM_KBP_LIB_REVISION,
  KM_KBP_TECH_KMX,
  "SIL International"
};

km_kbp_attr const & kmx_processor::attributes() const {
  return engine_attrs;
}

km_kbp_context_item * kmx_processor::get_intermediate_context() {
  KMX_WCHAR *buf = _kmx.GetContext()->BufMax(MAXCONTEXT);
  km_kbp_context_item *citems = nullptr;
  if (!ContextItemsFromAppContext(buf, &citems)){
      citems = new km_kbp_context_item(KM_KBP_CONTEXT_ITEM_END);
  }
  return citems;
}

km_kbp_keyboard_key * kmx_processor::get_key_list() const  {
  // Iterate through the groups and get the rules with virtual keys
  // and store the key along with the modifer.
  const uint32_t group_cnt = _kmx.GetKeyboard()->Keyboard->cxGroupArray;
  const LPGROUP group_array = _kmx.GetKeyboard()->Keyboard->dpGroupArray;
  GROUP *p_group;

  std::map<std::pair<km_kbp_virtual_key,uint32_t>, uint32_t> map_rules;
  km_kbp_virtual_key v_key;
  uint32_t modifier_flag;
// Use hash map to get the unique list
  for(auto i = decltype(group_cnt){0}; i < group_cnt; i++)
  {
    p_group = &group_array[i];
    if(p_group->fUsingKeys)
    {
      for(auto j = decltype(p_group->cxKeyArray){0}; j < p_group->cxKeyArray; j++)
      {
        v_key = p_group->dpKeyArray[j].Key;
        modifier_flag = p_group->dpKeyArray[j].ShiftFlags;
        if(modifier_flag == 0) {
          // This must be a ASCII character corresponding US Keyboard key cap
          if(!MapUSCharToVK(v_key, &v_key, &modifier_flag)) continue;
        }
        map_rules[std::make_pair(v_key,modifier_flag)] = (modifier_flag & K_MODIFIERFLAG); // Clear kmx special flags

      }
    }
  }
  // Now convert to the keyboard key array
  km_kbp_keyboard_key *rules = new km_kbp_keyboard_key[map_rules.size() + 1];
  std::map<std::pair<km_kbp_virtual_key,uint32_t>, uint32_t>::iterator it = map_rules.begin();
  int n = 0;
  while (it != map_rules.end()){
    auto pair = it->first;
    rules[n].key = pair.first;
    rules[n].modifier_flag = it->second;
    it++;
    n++;
  }
  // Insert list termination
  rules[n] =  KM_KBP_KEYBOARD_KEY_LIST_END;
  return rules;
}

km_kbp_keyboard_imx * kmx_processor::get_imx_list() const  {

  const uint32_t store_cnt = _kmx.GetKeyboard()->Keyboard->cxStoreArray;
  const LPSTORE store_array = _kmx.GetKeyboard()->Keyboard->dpStoreArray;
  uint16_t fn_count = 0;
  uint16_t fn_idx = 0;


  for(uint32_t i = 0; i < store_cnt; i++)
  {
    LPSTORE p_store = &store_array[i];
    if(p_store->dwSystemID == TSS_CALLDEFINITION)
		{
      fn_count++;
    }
  }

  km_kbp_keyboard_imx *imx_list = new km_kbp_keyboard_imx[fn_count + 1];

  for(uint32_t i = 0; i < store_cnt; i++)
  {
    LPSTORE p_store = &store_array[i];
    if(p_store->dwSystemID == TSS_CALLDEFINITION)
		{
			/* Break the store string into components */

			PKMX_CHAR full_fn_name = wstrtostr(p_store->dpString), lib_name, fn_name;

			lib_name = strtok(full_fn_name, ":");
			fn_name = strtok(NULL, ":");

			if(!lib_name || !fn_name)
			{
				//s->dwSystemID = TSS_CALLDEFINITION_LOADFAILED;
				delete[] full_fn_name;
				continue;
			}

      imx_list[fn_idx].library_name = strtowstr(lib_name);
      imx_list[fn_idx].function_name = strtowstr(fn_name);
      imx_list[fn_idx].store_no = i;
		  delete[] full_fn_name;
      fn_idx++;
		}
  }
  // Insert list termination
  imx_list[fn_idx] =  KM_KBP_KEYBOARD_IMX_END;
  return imx_list;
}

