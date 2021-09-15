(*
  Name:             DevIncludePaths
  Copyright:        Copyright (C) 2003-2017 SIL International.
  Documentation:    
  Description:      
  Create Date:      4 May 2012

  Modified Date:    8 Jun 2012
  Authors:          mcdurdin
  Related Files:    
  Dependencies:     

  Bugs:             
  Todo:             
  Notes:            
  History:          04 May 2012 - mcdurdin - I3307 - V9.0 - Delphi XE2 path and package manager
                    17 May 2012 - mcdurdin - I3321 - V9.0 - Fixup paths in Delphi source for v9.0
*)
unit DevIncludePaths;

interface

uses
  DevDelphiCompileWrapper;

type
  TIncludePaths = class
    //class function Get: string;
    class function Reset: Boolean;
    class function Touch: Boolean; static;
    class function Add(Path: string): Boolean;
  private
    class function ExpandEnvStrings(Path: string): string;
    class function AddToPath(const Key, Value, Path: string): Boolean; static;
    class function AddPathToPathDefinesMak(const Path: string): Boolean; static;
    class function AddPathToProjectXML(const ProjectXMLFileName,
      Path: string): Boolean; static;
    class function AddPathToIncludePath(var IncludePath: string; const Path: string): Boolean; static;
  end;

implementation

uses
  System.Classes,
  DevUtils,
  System.Win.Registry,
  System.StrUtils,
  System.SysUtils,
  System.Variants,
  WinApi.Windows,
  Xml.xmldom,
  Xml.xmlintf,
  Xml.xmldoc,

  SourceRootPath;

const
  ///SKey_IncludePaths = 'Software\S4S\Developer\Paths';
  ///SValue_DevIncludePaths = 'Include Paths';

  SKey_DelphiLibrary = 'Software\Embarcadero\BDS\'+DelphiMajorVersion+'\Library\Win32';
  SKey_DelphiLibrary64 = 'Software\Embarcadero\BDS\'+DelphiMajorVersion+'\Library\Win64';
  SFile_DelphiEnvironmentProject = '%AppData%\Embarcadero\BDS\'+DelphiMajorVersion+'\EnvOptions.proj';

  SValue_DelphiBrowsingPath = 'Browsing Path';
  SValue_DelphiSearchPath = 'Search Path';

  SDefault_DelphiSearchPath = '$(BDSLIB)\$(Platform)\release;$(BDSUSERDIR)\Imports;$(BDS)\Imports;$(BDSCOMMONDIR)\Dcp\$(Platform);$(BDS)\include;';
  SDefault_DelphiBrowsingPath =
    '$(BDS)\OCX\Servers;$(BDS)\SOURCE\VCL;$(BDS)\SOURCE\VCL\AppAnalytics;$(BDS)\source\rtl\common;'+
    '$(BDS)\SOURCE\RTL\SYS;$(BDS)\source\rtl\win;$(BDS)\source\ToolsAPI;$(BDS)\SOURCE\IBX;$(BDS)\source\Internet;'+
    '$(BDS)\SOURCE\PROPERTY EDITORS;$(BDS)\source\soap;$(BDS)\SOURCE\XML;$(BDS)\source\Indy10\Core;'+
    '$(BDS)\source\Indy10\System;$(BDS)\source\Indy10\Protocols;$(BDS)\source\fmx;$(BDS)\source\databinding\components;'+
    '$(BDS)\source\databinding\engine;$(BDS)\source\databinding\graph;$(BDS)\source\data;$(BDS)\source\data\ado;'+
    '$(BDS)\source\data\bde;$(BDS)\source\data\cloud;$(BDS)\source\data\datasnap;$(BDS)\source\data\dbx;'+
    '$(BDS)\source\data\dsnap;$(BDS)\source\data\Test;$(BDS)\source\data\vclctrls;$(BDS)\source\data\datasnap\connectors;'+
    '$(BDS)\source\data\datasnap\proxygen;$(BDS)\source\DataExplorer;$(BDS)\source\DUnit\Contrib\DUnitWizard\Source\Common;'+
    '$(BDS)\source\DUnit\Contrib\DUnitWizard\Source\Common\dunit;$(BDS)\source\DUnit\Contrib\DUnitWizard\Source\DelphiExperts\Common;'+
    '$(BDS)\source\DUnit\Contrib\DUnitWizard\Source\DelphiExperts\DUnitProject;'+
    '$(BDS)\source\DUnit\Contrib\DUnitWizard\Source\DelphiExperts\DUnitProject\dunit;'+
    '$(BDS)\source\DUnit\src;$(BDS)\source\DUnit\tests;$(BDS)\source\Experts;$(BDS)\source\indy\abstraction;'+
    '$(BDS)\source\indy\implementation;$(BDS)\source\indyimpl;$(BDS)\source\LiveTile;$(BDS)\source\Property Editors\Indy10;'+
    '$(BDS)\source\soap\wsdlimporter;$(BDS)\source\Visualizers;$(BDS)\source\xtab;$(BDS)\source\DUnit\Contrib\XMLReporting;'+
    '$(BDS)\source\DUnit\Contrib\XPGen;$(BDS)\source\data\rest;$(BDS)\source\data\firedac;$(BDS)\source\tethering;'+
    '$(BDS)\source\DUnitX;$(BDS)\source\data\ems;$(BDS)\source\rtl\net;$(BDS)\source\FlatBox2D;';

function SFile_PathDefinesMak: string;
begin
  Result := CSourceRootPath+'\PathDefines.mak';  // I3321
end;

{ TIncludePaths }

class function TIncludePaths.Add(Path: string): Boolean;
begin
  DevUtils.DevLog('addincludepath '+Path,True);
  Path := ExcludeTrailingPathDelimiter(Path);
  if not DirectoryExists(Path) then
  begin
    Result := False;
    DevUtils.DevLog('FAILED: path '+path+' does not exist.',True);
    Exit;
  end;

  Result := AddPathToPathDefinesMak(Path);
  Result := Result and AddToPath(SKey_DelphiLibrary, SValue_DelphiSearchPath, Path);
  Result := Result and AddToPath(SKey_DelphiLibrary, SValue_DelphiBrowsingPath, Path);
  Result := Result and AddToPath(SKey_DelphiLibrary64, SValue_DelphiSearchPath, Path);
  Result := Result and AddToPath(SKey_DelphiLibrary64, SValue_DelphiBrowsingPath, Path);
  Result := Result and AddPathToProjectXML(ExpandEnvStrings(SFile_DelphiEnvironmentProject), Path);
end;

class function TIncludePaths.AddPathToPathDefinesMak(const Path: string): Boolean;
var
  FPaths: string;
begin
  // File format:
  // # this file was generated by DevTools and should not be manually modified.
  // DELPHIINCLUDES=<paths>
  FPaths := '';

  with TStringList.Create do
  try
    if FileExists(SFile_PathDefinesMak) then
    begin
      LoadFromFile(SFile_PathDefinesMak);
      if Count > 1 then
        FPaths := ValueFromIndex[1];
    end;

    if AddPathToIncludePath(FPaths, Path) then
    begin
      Text :=
        '# This file was generated by DevTools and should not be manually modified.'#13#10+
        'DELPHIINCLUDES='+FPaths;
      SaveToFile(SFile_PathDefinesMak);
    end;
  finally
    Free;
  end;

  Result := True;
end;

class function TIncludePaths.AddPathToProjectXML(const ProjectXMLFileName, Path: string): Boolean;
var
  doc: IXMLDocument;
  sn, node: IXMLNode;
  IncludePath: string;
  I: Integer;
begin
  if not FileExists(ProjectXMLFileName) then
  begin
    Result := False;
    DevUtils.DevLog('FAILED: File '+ProjectXMLFileName+' does not exist.  Please start and exit Delphi to create the default project environment file.',True);
    Exit;
  end;

  doc := LoadXMLDocument(ProjectXMLFileName);
  node := doc.ChildNodes['Project']; //.ChildNodes['PropertyGroup'];

  for I := 0 to node.ChildNodes.Count - 1 do
  begin
    sn := node.ChildNodes[I];
    if (sn.NodeName = 'PropertyGroup') and
      not VarIsNull(sn.Attributes['Condition']) and
      ((Pos('Win32', sn.Attributes['Condition']) > 0) or
      (Pos('Win64', sn.Attributes['Condition']) > 0)) then
    begin
      IncludePath := sn.ChildNodes['DelphiBrowsingPath'].NodeValue;
      if AddPathToIncludePath(IncludePath, Path) then
        sn.ChildNodes['DelphiBrowsingPath'].nodeValue := IncludePath;

      IncludePath := sn.ChildNodes['DelphiLibraryPath'].NodeValue;
      if AddPathToIncludePath(IncludePath, Path) then
        sn.ChildNodes['DelphiLibraryPath'].nodeValue := IncludePath;
    end;
  end;
  if doc.Modified then
    doc.SaveToFile(ProjectXMLFileName);

  Result := True;
end;

class function TIncludePaths.AddPathToIncludePath(var IncludePath: string; const Path: string): Boolean;
begin
  Result := False;
  with TStringList.Create do
  try
    StrictDelimiter := True;
    Delimiter := ';';
    QuoteChar := #0;
    DelimitedText := IncludePath;
    if IndexOf(Path) < 0 then
    begin
      Add(Path);
      IncludePath := DelimitedText;
      Result := True;
    end;
  finally
    Free;
  end;
end;

class function TIncludePaths.AddToPath(const Key, Value, Path: string): Boolean;
var
  IncludePath: string;
begin
  Result := True;
  with TRegistry.Create do
  try
    if OpenKey(Key, True) then
    begin
      if ValueExists(Value)
        then IncludePath := ReadString(Value)
        else IncludePath := '';
      if AddPathToIncludePath(IncludePath, Path) then
        WriteString(Value, IncludePath);
    end;
  finally
    Free;
  end;
end;

class function TIncludePaths.ExpandEnvStrings(Path: string): string;
var
  buf: array[0..260] of char;
begin
  if ExpandEnvironmentStrings(PWideChar(Path), buf, 260) = 0 then
    raise Exception.Create('Unable to expand environment strings for '+Path);
  Result := buf;
end;

{class function TIncludePaths.Get: string;
begin
  with TRegistry.Create do
  try
    if OpenKey(SKey_IncludePaths, True) then
    begin
      if ValueExists(SValue_DevIncludePaths) then
        Result := ReadString(SValue_DevIncludePaths)
      else
        raise Exception.Create('Could not retrieve include paths from '+SKey_IncludePaths);
    end;
  finally
    Free;
  end;
end;}

class function TIncludePaths.Touch: Boolean;
begin
  if not FileExists(SFile_PathDefinesMak)
    then Result := Reset
    else Result := True;
end;

class function TIncludePaths.Reset: Boolean;
var
  doc: IXMLDocument;
  node: IXMLNode;
  ProjectFileName: string;
  I: Integer;
  sn: IXMLNode;
begin
  DevUtils.DevLog('resetincludepaths',True);

  with TRegistry.Create do
  try
    {if OpenKey(SKey_IncludePaths, True) then
    begin
      if ValueExists(SValue_DevIncludePaths) then
        DeleteValue(SValue_DevIncludePaths);
    end;}
    if OpenKey('\'+SKey_DelphiLibrary, False) then
    begin
      WriteString(SValue_DelphiSearchPath, SDefault_DelphiSearchPath);
      WriteString(SValue_DelphiBrowsingPath, SDefault_DelphiBrowsingPath);
    end;
  finally
    Free;
  end;

  with TStringList.Create do
  try
    Text :=
      '# empty path defines, reset by DevTools.  Don''t manually edit this file...'#13#10+
      'DELPHIINCLUDES=';
    SaveToFile(SFile_PathDefinesMak);
  finally
    Free;
  end;

  ProjectFileName := ExpandEnvStrings(SFile_DelphiEnvironmentProject);
  if FileExists(ProjectFileName) then
  begin
    doc := LoadXMLDocument(ProjectFileName);
    node := doc.ChildNodes['Project'];

    for I := 0 to node.ChildNodes.Count - 1 do
    begin
      sn := node.ChildNodes[I];
      if (sn.NodeName = 'PropertyGroup') and
        not VarIsNull(sn.Attributes['Condition']) and
        ((Pos('Win32', sn.Attributes['Condition']) > 0) or
        (Pos('Win64', sn.Attributes['Condition']) > 0)) then
      begin
        sn.ChildNodes['DelphiBrowsingPath'].NodeValue := SDefault_DelphiBrowsingPath;
        sn.ChildNodes['DelphiLibraryPath'].NodeValue := SDefault_DelphiSearchPath;
      end;
    end;
  end;

  if doc.Modified then
    doc.SaveToFile(ProjectFileName);

  Result := True;
end;

end.
