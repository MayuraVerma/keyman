#pragma once

#include <compfile.h>

namespace kmcmp{
KMX_BOOL AddCompileString(LPSTR buf);

} //kmcmp

KMX_BOOL AddCompileMessage(KMX_DWORD msg);

// TODO: These macros can return FALSE in functions that expect a DWORD CERR_x
//       return value type. This is just plain wrong!
#define SetError(err)       { if(AddCompileMessage(err) || (err & CERR_FATAL)) return FALSE; }
#define AddWarning(warn)    { if(AddCompileMessage(warn)) return FALSE; }
namespace kmcmp{
extern BOOL FWarnDeprecatedCode;
extern int currentLine;
}


PKMX_WCHAR strtowstr(PKMX_STR in);
PFILE_STORE FindSystemStore(PFILE_KEYBOARD fk, KMX_DWORD dwSystemID);
