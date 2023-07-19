/*
  Copyright:    © SIL International.
  Description:  This is an implementation of the LDML keyboard spec 3.0.
  Create Date:  7 Oct 2022
  Authors:      Steven R. Loomis
*/

#include "ldml_transforms.hpp"
#include "debuglog.h"
#include <algorithm>
#include <string>
#include "kmx/kmx_xstring.h"


#ifndef assert
#define assert(x)  // TODO-LDML
#endif

namespace km {
namespace kbp {
namespace ldml {

element::element(const USet &new_u, KMX_DWORD new_flags)
    : chr(), uset(new_u), flags((new_flags & ~LDML_ELEM_FLAGS_TYPE) | LDML_ELEM_FLAGS_TYPE_USET) {
}

element::element(km_kbp_usv ch, KMX_DWORD new_flags)
    : chr(ch), uset(), flags((new_flags & ~LDML_ELEM_FLAGS_TYPE) | LDML_ELEM_FLAGS_TYPE_CHAR) {
}

bool
element::is_uset() const {
  return (flags & LDML_ELEM_FLAGS_TYPE) == LDML_ELEM_FLAGS_TYPE_USET;
}

signed char
element::get_order() const {
  unsigned char uorder = ((flags & LDML_ELEM_FLAGS_ORDER_MASK) >> LDML_ELEM_FLAGS_ORDER_BITSHIFT);
  return (signed char)uorder;
}

signed char
element::get_tertiary() const {
  unsigned char uorder = ((flags & LDML_ELEM_FLAGS_TERTIARY_MASK) >> LDML_ELEM_FLAGS_TERTIARY_BITSHIFT);
  return (signed char)uorder;
}

bool
element::is_prebase() const {
  return !!(flags & LDML_ELEM_FLAGS_PREBASE);
}

bool
element::is_tertiary_base() const {
  return !!(flags & LDML_ELEM_FLAGS_TERTIARY_BASE);
}

KMX_DWORD
element::get_flags() const {
  return flags;
}

bool
element::matches(km_kbp_usv ch) const {
  if (is_uset()) {
    return uset.contains(ch);
  } else {
    return chr == ch;
  }
}

int
reorder_sort_key::compare(const reorder_sort_key &other) const {
  int primaryResult    = (int)primary    - (int)other.primary;
  int secondaryResult  = (int)secondary  - (int)other.secondary;
  int tertiaryResult   = (int)tertiary   - (int)other.tertiary;
  int quaternaryResult = (int)quaternary - (int)other.quaternary;

  if (primaryResult) {
    return primaryResult;
  } else if (secondaryResult) {
    return secondaryResult;
  } else if (tertiaryResult) {
    return tertiaryResult;
  } else if (quaternaryResult) {
    return quaternaryResult;
  } else {
    assert(quaternaryResult);  // quaternary is a string index, should always be !=
    int identityResult = (int)ch - (int)other.ch;  // tie breaker
    return identityResult;
  }
}

bool
reorder_sort_key::operator<(const reorder_sort_key &other) const {
  return (compare(other) < 0);
}

bool
reorder_sort_key::operator>(const reorder_sort_key &other) const {
  return (compare(other) > 0);
}

std::deque<reorder_sort_key>
reorder_sort_key::from(const std::u32string &str) {
  // construct a 'baseline' sort key, that is, in the absence of
  // any match rules.
  std::deque<reorder_sort_key> keylist;
  auto s   = str.begin();  // str iterator
  size_t c = 0;            // str index
  for (auto e = str.begin(); e < str.end(); e++, s++, c++) {
    keylist.emplace_back(reorder_sort_key{*s, 0, c, 0, c});
  }
  return keylist;
}

void
reorder_sort_key::dump() const {
  // for debugging…
  DebugLog("- U+%04X\t(%d, %d, %d, %d)", ch, (int)primary, (int)secondary, (int)tertiary, (int)quaternary);
}

size_t
element_list::match_end(const std::u32string &str) const {
  if (str.size() < size()) {
    return 0;  // input string too short, can't possibly match
  }
  // s: iterate from end to front of string
  auto s = str.rbegin();
  // e: end to front on elements.
  // we know the # of elements is <= length of string,
  // so we don't need to check the string's boundaries
  for (auto e = rbegin(); e < rend(); e++) {
    assert(s < str.rend()); // double check
    if (!e->matches(*s)) {
      // break out if this element doesn't match
      return 0;
    }
    s++;
  }
  return size();  // match size = element size
}

bool
element_list::load(const kmx::kmx_plus &kplus, kmx::KMXPLUS_ELEM id) {
  KMX_DWORD elementsLength;
  auto elements = kplus.elem->getElementList(id, elementsLength);
  assert((elementsLength == 0) || (elements != nullptr));
  for (size_t i = 0; i<elementsLength; i++) {
    auto e = elements[i];
    auto flags = e.flags;
    auto type = flags & LDML_ELEM_FLAGS_TYPE;
    if (type == LDML_ELEM_FLAGS_TYPE_CHAR) {
      emplace_back(e.element, flags); // char
    } else if (type == LDML_ELEM_FLAGS_TYPE_USET) {
      auto u = kplus.usetHelper.getUset(e.element);
      emplace_back(u, e.flags);
    } else {
      // not handled
      assert((type != LDML_ELEM_FLAGS_TYPE_USET) && (type != LDML_ELEM_FLAGS_TYPE_CHAR));
      return false;
    }
  }
  return true;
}

std::deque<reorder_sort_key> &
element_list::update_sort_key(size_t offset, std::deque<reorder_sort_key> &key) const {
  size_t c = 0;
  for (auto e = begin(); e < end(); e++) {
    auto &k = key.at(offset + c);
    if (!e->matches(k.ch)) {
      DebugLog("!! updateSortKey(%d+%d): element did not re-match the sortkey", offset, c);
      k.dump();
      // TODO-LDML: assertion follows
    }
    assert(e->matches(k.ch));        // double check that this element matches
    k.primary  = e->get_order();
    k.tertiary = e->get_tertiary();  // TODO-LDML: need more detailed tertiary work
    c++;
  }
  return key;
}

reorder_entry::reorder_entry(const element_list &new_elements) : elements(new_elements), before() {
}
reorder_entry::reorder_entry(const element_list &new_elements, const element_list &new_before) : elements(new_elements), before(new_before) {
}

size_t
reorder_entry::match_end(std::u32string &str, size_t offset, size_t len) const {
  auto substr      = str.substr(offset, len);
  size_t match_len = elements.match_end(substr);
  if (match_len == 0) {
    return 0;
  }

  if (!before.empty()) {
    // does not match before offset
    std::u32string prefix = substr.substr(0, substr.size() - match_len);
    // make sure the 'before' is present
    if (before.match_end(prefix) == 0) {
      return 0;  // break out.
    }
  }
  return match_len;
}

bool
reorder_group::apply(std::u32string &str) const {
  /** did we apply anything */
  bool applied = false;
  /** did we match anything */
  bool some_match = false;

  // get a baseline sort key
  auto sort_keys = reorder_sort_key::from(str);

  // apply ALL reorders in the group.
  for (const auto &r : list) {
    // work backward from end of string forward
    // That is, see if "abc" matches "abc" or "ab" or "a"
    for (size_t s = str.size(); s > 0; s--) {
      size_t submatch = r.match_end(str, 0, s);
      if (submatch != 0) {
        // update the sort key
        size_t sub_match_start = s - submatch;
        r.elements.update_sort_key(sub_match_start, sort_keys);
        some_match = true;
      }
    }
    // c++;
  }
  if (!some_match) {
    // DebugLog("Skip: No reorder elements matched.");
    return false;  // nothing matched, so no work.
  }

  size_t match_len = str.size();  // TODO-LDML: for now, assume matches entire string

  std::u32string prefix = str;
  prefix.resize(str.size() - match_len);  // just the part before the matched part.
  // just the suffix (the matched part)
  std::u32string suffix = str.substr(prefix.size(), match_len);

  /** pointer to the beginning of the current run. */
  std::deque<reorder_sort_key>::iterator run_start = sort_keys.begin();
  for(auto e = run_start; e != sort_keys.end(); e++) {
    if ((e->primary == 0) && (e != run_start)) { // it's a base
      auto run_end = e - 1;
      std::sort(run_start, run_end); // reversed because it's a reverse iterator…?
      // move the start
      run_start = e; // next run starts here
    }
  }
  // sort the last run in the string as well.
  if (run_start != sort_keys.end()) {
    std::sort(run_start, sort_keys.end()); // reversed because it's a reverse iterator…?
  }
  // recombine into a str
  std::u32string newSuffix;
  size_t q = sort_keys.begin()->quaternary;  //
  for (auto e = sort_keys.begin(); e < sort_keys.end(); e++, q++) {
    if (q != e->quaternary) {                // something rearranged in this subrange
      applied = true;
    }
    newSuffix.append(1, e->ch);
  }
  if (applied) {
    str.resize(prefix.size());
    str.append(newSuffix);
  } else {
    // DebugLog("Skip: no reordering change detected");
  }
  return applied;
}

transform_entry::transform_entry(const std::u32string &from, const std::u32string &to) : fFrom(from), fTo(to) {
}

size_t
transform_entry::match(const std::u32string &input) const {
  if (input.length() < fFrom.length()) {
    return 0;
  }
  // string at end
  auto substr = input.substr(input.length() - fFrom.length(), fFrom.length());
  if (substr != fFrom) {
    return 0;
  }
  return substr.length();
}

std::u32string
transform_entry::apply(const std::u32string & /*input*/, size_t /*matchLen*/) const {
  return fTo;
}

any_group::any_group(const transform_group &g) : type(any_group_type::transform), transform(g), reorder() {
}
any_group::any_group(const reorder_group &g) : type(any_group_type::reorder), transform(), reorder(g) {
}

transforms::transforms() : transform_groups() {
}

void
transforms::addGroup(const transform_group &s) {
  transform_groups.emplace_back(s);
}

void
transforms::addGroup(const reorder_group &s) {
  transform_groups.emplace_back(s);
}

transform_group::transform_group() {
}

/**
 * return the first transform match in this group
 */
const transform_entry *
transform_group::match(const std::u32string &input, size_t &subMatched) const {
  for (auto transform = begin(); (subMatched == 0) && (transform < end()); transform++) {
    // TODO-LDML: non regex implementation
    // is the match area too short?
    subMatched = transform->match(input);
    if (subMatched != 0) {
      return &(*transform);  // return alias to transform
    }
  }
  return nullptr;
}

/**
 * Apply this entire transform set to the input.
 * Example: input "abc" -> output="xyz", return=2:  replace last two chars "bc" with "xyz", so final output = "abxyz";
 * @param input input string, will match at end: unmodified
 * @param output on output: if return>0, contains text to replace
 * @return match length: number of chars at end of input string to modify.  0 if no match.
 */
size_t
transforms::apply(const std::u32string &input, std::u32string &output) {
  /**
   * Example:
   * Group0:   za -> c, a -> bb
   * Group1:   bb -> ccc
   * Group2:   cc -> d
   * Group3:   tcd -> e
   *
   * Initial condition: matched = subMatched = 0. updatedInput = input = 'ta', output = ''
   *
   * Group0:  matches 'a',  subMatched=1, output='bb', updatedInput='tbb', matched=1
   *  Initial match. subMatched=1 which is > the previous output.length,
   *  so matched += (1-0) == 1
   *
   * Group1:  matches 'bb', subMatched=2, output='ccc', updatedInput='tccc', matched=1
   *  Although the transform group matched 2 chars ('bb'), the match in the original is 1
   *  This time subMatched=2 but previous output.length was 2, so matched remains at 1
   *  In other words, we didn't match outside of the existing match boundary.
   *
   * Group2:  matches 'cc', subMatched=2, output='cd', updatedInput='tcd', matched=1
   *  subMatched <= previous output.length, so no change to mathed
   *
   * Group3:  matches 'tcd', subMatched=3, output='e', updatedInput='e', matched=2
   *  Now subMatched=3, but previous output ('cd').length is only 2.
   *  In other words, we matched before the previous output's start - we matched the 't' also
   *  or this reason, matched+=(3-2) == 1.  So matched is now 2.
   */

  /**
   * Accumulate the maximum matched size of the end of 'input' here.
   * It will be replaced with 'output'.
   * Matched can increment.
   */
  size_t matched = 0;
  /** modified copy of input */
  std::u32string updatedInput = input;
  for (auto group = transform_groups.begin(); group < transform_groups.end(); group++) {
    // for each transform group
    // break out once there's a match
    // TODO-LDML: reorders
    // Assume it's a non reorder group
    /** Length of match within this group*/
    size_t subMatched = 0;

    // find the first match in this group (if present)
    // TODO-LDML: check if reorder
    if (group->type == any_group_type::transform) {
      auto transform = group->transform.match(updatedInput, subMatched);

      if (transform != nullptr) {
        // now apply the found transform

        // update subOutput (string) and subMatched
        std::u32string subOutput = transform->apply(updatedInput, subMatched);

        // remove the matched part of the updatedInput
        updatedInput.resize(updatedInput.length() - subMatched);  // chop of the subMatched part at end
        updatedInput.append(subOutput);                           // subOutput could be empty such as in backspace transform

        if (subMatched > output.size()) {
          // including first time through
          // expand match by amount subMatched prior to output
          matched += (subMatched - output.size());
        }  // else: didn't match prior to the existing output, so don't expand 'match'

        // now update 'output'
        if (subOutput.length() >= output.length() || subMatched > output.length()) {
          output = subOutput;  // replace all output
        } else {
          // replace output with new output
          output.resize(output.length() - subMatched);
          output.append(subOutput);
        }
      }
    } else if (group->type == any_group_type::reorder) {
      // TODO-LDML: cheesy solution
      std::u32string str2 = updatedInput;
      if (group->reorder.apply(str2)) {
        // pretend the whole thing matched
        output.resize(0);
        output.append(str2);
        updatedInput.resize(0);
        updatedInput.append(str2);
        matched = output.length();
      }
    }
    // else: continue to next group
  }
  /**
   * TODO-LDML: optimization to contract 'matched' if possible.
   * We could decrement 'matched' for every char of output
   * which is already in input. Example (regex example):
   * - str = "xxyyzz";
   * - s/zz$/z/ -> match=2, output='z'
   * - s/z$/zz/ -> match=2, output='zz'
   *      (but could contract to match=0, output='' as already present)
   * - s/zz$/zw/ -> match=2, output='zw'
   *      (but could contract to match=1, output='w')
   *
   * could also handle from="x" to="x" as match=0
   */
  return matched;
}

// simple impl
bool
transforms::apply(std::u32string &str) {
  std::u32string output;
  size_t matchLength = apply(str, output);
  if (matchLength == 0) {
    return false;
  }
  str.resize(str.size() - matchLength);
  str.append(output);
  return true;
}
// Loader

transforms *
transforms::load(
    const kmx::kmx_plus &kplus,
    const kbp::kmx::COMP_KMXPLUS_TRAN *tran,
    const kbp::kmx::COMP_KMXPLUS_TRAN_Helper &tranHelper) {
  if (tran == nullptr) {
    DebugLog("for tran: tran is null");
    assert(false);
    return nullptr;
  }
  if (!tranHelper.valid()) {
    DebugLog("for tran: tranHelper is invalid");
    assert(false);
    return nullptr;
  }
  if (nullptr == kplus.elem) {
    DebugLog("for tran: kplus.elem == nullptr");
    assert(false);
    return nullptr;
  }
  if (nullptr == kplus.strs) {
    DebugLog("for tran: kplus.strs == nullptr");  // need a string table to get strings
    assert(false);
    return nullptr;
  }
  if (nullptr == kplus.vars) {
    DebugLog("for tran: kplus.vars == nullptr");  // need a vars table to get maps
    assert(false);
    return nullptr;
  }

  // with that out of the way, let's set it up

  transforms *transforms = new ldml::transforms();

  for (KMX_DWORD groupNumber = 0; groupNumber < tran->groupCount; groupNumber++) {
    const kmx::COMP_KMXPLUS_TRAN_GROUP *group = tranHelper.getGroup(groupNumber);
    // C++20 returns a reference here
    // auto &newGroup = allGroups->emplace_back();

    if (group->type == LDML_TRAN_GROUP_TYPE_TRANSFORM) {
      transform_group newGroup;

      for (KMX_DWORD itemNumber = 0; itemNumber < group->count; itemNumber++) {
        const kmx::COMP_KMXPLUS_TRAN_TRANSFORM *element = tranHelper.getTransform(group->index + itemNumber);
        const std::u32string fromStr                    = kmx::u16string_to_u32string(kplus.strs->get(element->from));
        const std::u32string toStr                      = kmx::u16string_to_u32string(kplus.strs->get(element->to));
        std::u16string mapFrom, mapTo;

        if (element->mapFrom && element->mapTo) {
          // strings: variable name
          mapFrom = kplus.strs->get(element->mapFrom);
          mapTo   = kplus.strs->get(element->mapTo);
        }

        newGroup.emplace_back(fromStr, toStr /* ,mapFrom, mapTo */);  // creating a transform_entry
      }
      transforms->addGroup(newGroup);
    } else if (group->type == LDML_TRAN_GROUP_TYPE_REORDER) {
      reorder_group newGroup;

      // fetch each reorder in the group
      for (KMX_DWORD itemNumber = 0; itemNumber < group->count; itemNumber++) {
        const kmx::COMP_KMXPLUS_TRAN_REORDER *reorder = tranHelper.getReorder(group->index + itemNumber);

        element_list elements;
        element_list before;

        bool load_ok = elements.load(kplus, reorder->elements) && before.load(kplus, reorder->before);
        assert(load_ok);
        if (load_ok) {
          newGroup.list.emplace_back(elements, before);
        } else {
          return nullptr;
        }
      }
      transforms->addGroup(newGroup);
    } else {
      // internal error - some other type - should have been caught by validation
      DebugLog("ERROR: some other type");
      assert(false);
      return nullptr;
    }
  }
  return transforms;
}

}  // namespace ldml
}  // namespace kbp
}  // namespace km
