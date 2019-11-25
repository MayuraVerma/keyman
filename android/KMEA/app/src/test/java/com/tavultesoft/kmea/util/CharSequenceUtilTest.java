package com.tavultesoft.kmea.util;

import org.junit.Assert;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.robolectric.RobolectricTestRunner;

import com.tavultesoft.kmea.util.CharSequenceUtil;

@RunWith(RobolectricTestRunner.class)
public class CharSequenceUtilTest {
  // Smiley emoji U+1F600 = D800 DC3D
  private final String SMILEY_HIGH_SURROGATE_PAIR = "\uD800";
  private final String SMILEY_LOW_SURROGATE_PAIR = "\uDC3D";
  private final String SMILEY = SMILEY_HIGH_SURROGATE_PAIR + SMILEY_LOW_SURROGATE_PAIR;

  // Winking emoji U+1F609 = D800 DC3C
  private final String WINK = "\uD800\uDC3C";

  private final String COMPOSING_DOT_ABOVE = "\u0307";
  private final String COMPOSING_CIRCUMFLEX_ACCENT = "\u0302";

  private final String P_COMPOSING_DOT_ABOVE = "p" + COMPOSING_DOT_ABOVE;
  private final String P_COMPOSING_CIRCUMFLEX_ACCENT = "p" + COMPOSING_CIRCUMFLEX_ACCENT;

  //region countSurrogatePairs tests

  @Test
  public void test_countSurrogatePairs_invalid_input() {

    // Test invalid input doesn't throw exception

    // null sequence
    CharSequence sequence = null;
    int numPairs = CharSequenceUtil.countSurrogatePairs(sequence, 1);
    Assert.assertEquals(0, numPairs);

    // negative dn
    sequence = SMILEY + " Day";
    numPairs = CharSequenceUtil.countSurrogatePairs(sequence, -1);
    Assert.assertEquals(0, numPairs);

    // dn longer than the sequence length
    numPairs = CharSequenceUtil.countSurrogatePairs(sequence, sequence.length()+5);
    Assert.assertEquals(1, numPairs);
  }

  @Test
  public void test_countSurrogatePairs_zero_pairs() {

    // Test for scenarios that expect 0 surrogate pairs
    CharSequence sequence = "Zero emojis";
    int numPairs = CharSequenceUtil.countSurrogatePairs(sequence, sequence.length());
    Assert.assertEquals(0, numPairs);

    // dn doesn't reach the surrogate pair
    sequence = "Zero emojis" + SMILEY + "!";
    numPairs = CharSequenceUtil.countSurrogatePairs(sequence, 0);
    Assert.assertEquals(0, numPairs);

    numPairs = CharSequenceUtil.countSurrogatePairs(sequence, 1);
    Assert.assertEquals(0, numPairs);
  }

  @Test
  public void test_countSurrogatePairs_one_pair() {

    // Test for scenarios that expect 1 surrogate pair
    CharSequence sequence = SMILEY_LOW_SURROGATE_PAIR;
    int numPairs = CharSequenceUtil.countSurrogatePairs(sequence, 1);
    Assert.assertEquals(1, numPairs);

    sequence = "Have A " + SMILEY;
    numPairs = CharSequenceUtil.countSurrogatePairs(sequence, 1);
    Assert.assertEquals(1, numPairs);

    numPairs = CharSequenceUtil.countSurrogatePairs(sequence, 2);
    Assert.assertEquals(1, numPairs);

    numPairs = CharSequenceUtil.countSurrogatePairs(sequence, 6);
    Assert.assertEquals(1, numPairs);

    sequence = "Have A " + SMILEY + WINK + " Day";
    numPairs = CharSequenceUtil.countSurrogatePairs(sequence, 5);
    Assert.assertEquals(1, numPairs);

    numPairs = CharSequenceUtil.countSurrogatePairs(sequence, 6);
    Assert.assertEquals(1, numPairs);
  }

  @Test
  public void test_countSurrogatePairs_two_pairs() {

    // Test for scenarios that expect 2 surrogate pairs
    CharSequence sequence = "Have A " + SMILEY + WINK + " Day";
    int numPairs = CharSequenceUtil.countSurrogatePairs(sequence, 7);
    Assert.assertEquals(2, numPairs);

    numPairs = CharSequenceUtil.countSurrogatePairs(sequence, 8);
    Assert.assertEquals(2, numPairs);
  }

  //endregion

  // region restoreChars tests

  @Test
  public void test_restoreChars_invalid_input() {
    // Test invalid input doesn't throw exception
    // null sequence
    CharSequence expectedChars = null;
    CharSequence currentContext = "qwerty";
    CharSequence charsToRestore = CharSequenceUtil.restoreChars(expectedChars, currentContext);
    Assert.assertEquals("", charsToRestore);

    expectedChars = "qwerty";
    currentContext = null;
    charsToRestore = CharSequenceUtil.restoreChars(expectedChars, currentContext);
    Assert.assertEquals("", charsToRestore);

    expectedChars = WINK;
    currentContext = "notamatch";
    charsToRestore = CharSequenceUtil.restoreChars(expectedChars, currentContext);
    Assert.assertEquals("", charsToRestore);
  }

  @Test
  public void test_restoreChars_split_surrogate_pair() {
    CharSequence expectedChars = "o" + P_COMPOSING_CIRCUMFLEX_ACCENT + P_COMPOSING_CIRCUMFLEX_ACCENT + WINK + "p";
    CharSequence currentContext = P_COMPOSING_CIRCUMFLEX_ACCENT + SMILEY_HIGH_SURROGATE_PAIR;
    CharSequence charsToRestore = CharSequenceUtil.restoreChars(expectedChars, currentContext);
    Assert.assertEquals("\uDC3C" + "p", charsToRestore);
  }

  @Test
  public void test_restoreChars_expected_chars() {
    CharSequence expectedChars = "qwertyp" + SMILEY + COMPOSING_DOT_ABOVE;
    CharSequence currentContext = "qwertyp";
    CharSequence charsToRestore = CharSequenceUtil.restoreChars(expectedChars, currentContext);
    Assert.assertEquals(SMILEY + COMPOSING_DOT_ABOVE, charsToRestore);

    expectedChars = "qwertyp" + COMPOSING_CIRCUMFLEX_ACCENT + "p" + COMPOSING_CIRCUMFLEX_ACCENT;
    currentContext = "qwertyp";
    charsToRestore = CharSequenceUtil.restoreChars(expectedChars, currentContext);
    Assert.assertEquals(COMPOSING_CIRCUMFLEX_ACCENT + "p" + COMPOSING_CIRCUMFLEX_ACCENT, charsToRestore);

    expectedChars = "qwertyp" + COMPOSING_CIRCUMFLEX_ACCENT + "p" + COMPOSING_CIRCUMFLEX_ACCENT;
    currentContext = "qwerty";
    charsToRestore = CharSequenceUtil.restoreChars(expectedChars, currentContext);
    Assert.assertEquals("p" + COMPOSING_CIRCUMFLEX_ACCENT + "p" + COMPOSING_CIRCUMFLEX_ACCENT, charsToRestore);
  }

  //endregion

  // region adjustCursorPosition tests

  @Test
  public void test_adjustCursorPosition_invalid_input() {
    CharSequence sequence = null;
    String s = P_COMPOSING_CIRCUMFLEX_ACCENT + P_COMPOSING_CIRCUMFLEX_ACCENT;
    int move = CharSequenceUtil.adjustCursorPosition(sequence, s);
    Assert.assertEquals(0, move);

    sequence = P_COMPOSING_CIRCUMFLEX_ACCENT + P_COMPOSING_CIRCUMFLEX_ACCENT;
    s = null;
    move = CharSequenceUtil.adjustCursorPosition(sequence, s);
    Assert.assertEquals(0, move);
  }

  @Test
  public void test_adjustCursorPosition_split_surrogate_pair() {
    CharSequence sequence = SMILEY_LOW_SURROGATE_PAIR + P_COMPOSING_CIRCUMFLEX_ACCENT + SMILEY_HIGH_SURROGATE_PAIR;
    String s = P_COMPOSING_CIRCUMFLEX_ACCENT;
    int move = CharSequenceUtil.adjustCursorPosition(sequence, s);
    Assert.assertEquals(1, move);
  }

  @Test
  public void test_adjustCursorPosition_move() {
    CharSequence charsBefore = P_COMPOSING_DOT_ABOVE + SMILEY;
    String s = P_COMPOSING_DOT_ABOVE;
    int move = CharSequenceUtil.adjustCursorPosition(charsBefore, s);
    Assert.assertEquals(2, move);

    charsBefore = P_COMPOSING_CIRCUMFLEX_ACCENT + SMILEY;
    s = P_COMPOSING_CIRCUMFLEX_ACCENT;
    move = CharSequenceUtil.adjustCursorPosition(charsBefore, s);
    Assert.assertEquals(2, move);

    charsBefore = P_COMPOSING_CIRCUMFLEX_ACCENT + P_COMPOSING_CIRCUMFLEX_ACCENT + SMILEY + P_COMPOSING_DOT_ABOVE;
    s = P_COMPOSING_CIRCUMFLEX_ACCENT + P_COMPOSING_CIRCUMFLEX_ACCENT;
    move = CharSequenceUtil.adjustCursorPosition(charsBefore, s);
    Assert.assertEquals(4, move);

    // Firefox behavior
    charsBefore = "o" + P_COMPOSING_CIRCUMFLEX_ACCENT + P_COMPOSING_CIRCUMFLEX_ACCENT + SMILEY + "p";
    s = P_COMPOSING_CIRCUMFLEX_ACCENT + P_COMPOSING_CIRCUMFLEX_ACCENT;
    move = CharSequenceUtil.adjustCursorPosition(charsBefore, s);
    Assert.assertEquals(3, move);
  }

  //endregion

}
