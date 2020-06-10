//
//  PackageJSONTests.swift
//  KeymanEngineTests
//
//  Created by Joshua Horton on 6/1/20.
//  Copyright © 2020 SIL International. All rights reserved.
//

import XCTest
import Reachability

@testable import KeymanEngine

class KMPJSONTests: XCTestCase {
  private func loadObjectFromJSON<Type: Decodable>(at file: URL) throws -> Type {
    let fileContents: String = try String(contentsOf: file, encoding: .utf8).replacingOccurrences(of: "\r", with: "")
    let jsonData = fileContents.data(using: .utf8)!
    let decoder = JSONDecoder()
    return try decoder.decode(Type.self, from: jsonData)
  }

  func testLanguageDecoding() throws {
    let lang_en: KMPLanguage = try loadObjectFromJSON(at: TestUtils.PackageJSON.language_en)

    XCTAssertEqual(lang_en.name, "English")
    XCTAssertEqual(lang_en.languageId, "en")

    let lang_km: KMPLanguage = try loadObjectFromJSON(at: TestUtils.PackageJSON.language_km)

    XCTAssertEqual(lang_km.name, "Central Khmer (Khmer, Cambodia)")
    XCTAssertEqual(lang_km.languageId, "km")

    let lang_str_latn: KMPLanguage = try loadObjectFromJSON(at: TestUtils.PackageJSON.language_str_latn)

    XCTAssertEqual(lang_str_latn.name, "SENĆOŦEN")
    // Is upper-cased in the .json, but should be lower-cased on deserialization.
    // Our language-tag matching is case-insensitive.
    XCTAssertEqual(lang_str_latn.languageId, "str-latn")
  }

  // A helper method, since these are useful in two separate tests.
  func keyboard_khmer_angkor_assertions(_ khmer_angkor: KMPKeyboard) {
    XCTAssertEqual(khmer_angkor.languages.count, 1)
    XCTAssertEqual(khmer_angkor.languages[0].name, "Central Khmer (Khmer, Cambodia)")
    XCTAssertEqual(khmer_angkor.languages[0].languageId, "km")

    XCTAssertEqual(khmer_angkor.name, "Khmer Angkor")
    XCTAssertEqual(khmer_angkor.keyboardId, "khmer_angkor")
    XCTAssertEqual(khmer_angkor.version, "1.0.6")
    XCTAssertEqual(khmer_angkor.font, "Mondulkiri-R.ttf")
    XCTAssertEqual(khmer_angkor.osk, "Mondulkiri-R.ttf")
    XCTAssertEqual(khmer_angkor.isRTL, false)
  }

  func testKeyboardDecoding() throws {
    let khmer_angkor: KMPKeyboard = try loadObjectFromJSON(at: TestUtils.PackageJSON.keyboard_khmer_angkor)
    keyboard_khmer_angkor_assertions(khmer_angkor)
  }

  // A helper method, since these are useful in two separate tests.
  func lexical_model_nrc_en_mtnt_assertions(_ nrc_en_mtnt: KMPLexicalModel, version: String? = nil) {
    XCTAssertEqual(nrc_en_mtnt.name, "English dictionary (MTNT)")
    XCTAssertEqual(nrc_en_mtnt.lexicalModelId, "nrc.en.mtnt")
    // Our example case does not define either of these two values.
    // One (isRTL), we assume a default value for.
    XCTAssertEqual(nrc_en_mtnt.version, version)
    XCTAssertEqual(nrc_en_mtnt.isRTL, false)

    XCTAssertEqual(nrc_en_mtnt.languages.count, 3)
    XCTAssertEqual(nrc_en_mtnt.languages[0].languageId, "en")
    XCTAssertEqual(nrc_en_mtnt.languages[1].languageId, "en-us")
    XCTAssertEqual(nrc_en_mtnt.languages[2].languageId, "en-ca")
  }

  func testLexicalModelDecoding() throws {
    let nrc_en_mtnt: KMPLexicalModel = try loadObjectFromJSON(at: TestUtils.PackageJSON.model_nrc_en_mtnt)
    lexical_model_nrc_en_mtnt_assertions(nrc_en_mtnt)
  }

  func kmp_info_khmer_angkor_assertions(_ khmer_angkor: KMPMetadata) {
    XCTAssertTrue(khmer_angkor.isValid)
    XCTAssertEqual(khmer_angkor.packageType, KMPMetadata.PackageType.Keyboard)

    XCTAssertNotNil(khmer_angkor.keyboards)
    XCTAssertEqual(khmer_angkor.keyboards!.count, 1)
    keyboard_khmer_angkor_assertions(khmer_angkor.keyboards![0])

    XCTAssertNil(khmer_angkor.lexicalModels)

    XCTAssertNotNil(khmer_angkor.files)
    XCTAssertEqual(khmer_angkor.files!.count, 16)

    XCTAssertNotNil(khmer_angkor.info)
    XCTAssertEqual(khmer_angkor.info!.version!.description, "1.0.6")
    XCTAssertNil(khmer_angkor.info!.version!.url)
    XCTAssertEqual(khmer_angkor.info!.author!.description, "Makara Sok")
    XCTAssertEqual(khmer_angkor.info!.author!.url, "mailto:makara@keyman.com")

    XCTAssertEqual(khmer_angkor.system.fileVersion, "7.0")

    XCTAssertNil(khmer_angkor.options.graphicFile)
    XCTAssertNil(khmer_angkor.options.readmeFile)
  }

  func testKeyboardPackageInfoDecoding() throws {
    let khmer_angkor: KMPMetadata = try loadObjectFromJSON(at: TestUtils.PackageJSON.kmp_json_khmer_angkor)
    kmp_info_khmer_angkor_assertions(khmer_angkor)
  }

  func kmp_info_nrc_en_mtnt_assertions(_ nrc_en_mtnt: KMPMetadata, version: String? = nil) {
    XCTAssertTrue(nrc_en_mtnt.isValid)
    XCTAssertEqual(nrc_en_mtnt.packageType, KMPMetadata.PackageType.LexicalModel)

    XCTAssertNotNil(nrc_en_mtnt.lexicalModels)
    XCTAssertEqual(nrc_en_mtnt.lexicalModels!.count, 1)
    lexical_model_nrc_en_mtnt_assertions(nrc_en_mtnt.lexicalModels![0], version: version)

    XCTAssertNil(nrc_en_mtnt.keyboards)

    XCTAssertNotNil(nrc_en_mtnt.files)
    XCTAssertEqual(nrc_en_mtnt.files!.count, 1)

    XCTAssertNotNil(nrc_en_mtnt.info)
    XCTAssertEqual(nrc_en_mtnt.info!.version!.description, "0.1.4")
    XCTAssertNil(nrc_en_mtnt.info!.version!.url)
    XCTAssertEqual(nrc_en_mtnt.info!.author!.description, "Eddie Antonio Santos")
    XCTAssertEqual(nrc_en_mtnt.info!.author!.url, "mailto:easantos@ualberta.ca")

    XCTAssertEqual(nrc_en_mtnt.system.fileVersion, "12.0")

    XCTAssertNil(nrc_en_mtnt.options.graphicFile)
    XCTAssertNil(nrc_en_mtnt.options.readmeFile)
  }

  func testLexicalModelPackageInfoDecoding() throws {
    let nrc_en_mtnt: KMPMetadata = try loadObjectFromJSON(at: TestUtils.PackageJSON.kmp_json_nrc_en_mtnt)
    kmp_info_nrc_en_mtnt_assertions(nrc_en_mtnt)
  }

  func testKMPKeyboardFrom() throws {
    guard let constructedMetadata = KMPKeyboard(from: TestUtils.Keyboards.khmer_angkor) else {
      XCTFail("Could not construct KMPKeyboard from InstallableKeyboard")
      return
    }

    if let _ = KMPKeyboard(from: TestUtils.LexicalModels.mtnt) {
      XCTFail("Constructed KMPKeyboard from InstallableLexicalModel")
    }

    // The original version extracted from a KMP.
    let kmpMetadata: KMPKeyboard = try loadObjectFromJSON(at: TestUtils.PackageJSON.keyboard_khmer_angkor)!

    XCTAssertEqual(constructedMetadata.id, kmpMetadata.id)
    XCTAssertEqual(constructedMetadata.name, kmpMetadata.name)
    XCTAssertEqual(constructedMetadata.version, kmpMetadata.version)
    // The pre-extracted version currently does not have fonts set, so the following two lines will fail.
//    XCTAssertEqual(constructedMetadata.font, kmpMetadata.font)
//    XCTAssertEqual(constructedMetadata.osk, kmpMetadata.osk)
    XCTAssertEqual(constructedMetadata.isRTL, kmpMetadata.isRTL)

    // Language assertions are not as easy.
    XCTAssertTrue(kmpMetadata.languages.contains(where: { language in
      // There will only be a single language in our 'constructed' version, since it's built
      // from a single LanguageResource.
      let constructedLanguage = constructedMetadata.languages[0]
      return constructedLanguage.languageId == language.languageId &&
             constructedLanguage.name == language.name
    }))
  }

  func testKMPLexicalModelFrom() throws {
    guard let constructedMetadata = KMPLexicalModel(from: TestUtils.LexicalModels.mtnt) else {
      XCTFail("Could not construct KMPLexicalModel from InstallableLexicalModel")
      return
    }

    if let _ = KMPLexicalModel(from: TestUtils.Keyboards.khmer_angkor) {
      XCTFail("Constructed KMPLexicalModel from InstallableKeyboard")
    }

    // The original version extracted from a KMP.
    let kmpMetadata: KMPLexicalModel = try loadObjectFromJSON(at: TestUtils.PackageJSON.model_nrc_en_mtnt)!

    XCTAssertEqual(constructedMetadata.id, kmpMetadata.id)
    XCTAssertEqual(constructedMetadata.name, kmpMetadata.name)
    // The following line will fail because kmpMetadata.version was only set on the package level,
    // not directly within the KMPLexicalModel definition.
    //XCTAssertEqual(constructedMetadata.version, kmpMetadata.version)
    XCTAssertEqual(constructedMetadata.isRTL, kmpMetadata.isRTL)

    // Language assertions are not as easy.
    XCTAssertTrue(kmpMetadata.languages.contains(where: { language in
      // There will only be a single language in our 'constructed' version, since it's built
      // from a single LanguageResource.  We can't reconstruct the original language name
      // for lexical models at this time.
      let constructedLanguage = constructedMetadata.languages[0]
      return constructedLanguage.languageId == language.languageId
    }))
  }

  func testKMPResourceMatches() throws {
    let kmp_khmer_angkor: KMPKeyboard = try loadObjectFromJSON(at: TestUtils.PackageJSON.keyboard_khmer_angkor)!

    //let wrappedKeyboard = KMPKeyboard(from: TestUtils.Keyboards.khmer_angkor)!

    XCTAssertTrue(kmp_khmer_angkor.matches(installable: TestUtils.Keyboards.khmer_angkor))
    XCTAssertFalse(kmp_khmer_angkor.matches(installable: TestUtils.LexicalModels.mtnt))

    let kmp_mtnt: KMPLexicalModel = try loadObjectFromJSON(at: TestUtils.PackageJSON.model_nrc_en_mtnt)!
    kmp_mtnt.setNilVersion(to: "0.1.4")

    XCTAssertTrue(kmp_mtnt.matches(installable: TestUtils.LexicalModels.mtnt))
    XCTAssertFalse(kmp_mtnt.matches(installable: TestUtils.Keyboards.khmer_angkor))

    // Three models are listed; we choose the second variant since it uses a different language
    // code than specified under TestUtils.LexicalModels.mtnt.
    let constructed_mtnt: KMPLexicalModel = KMPLexicalModel(from: kmp_mtnt.installableResources[1])!

    XCTAssertFalse(constructed_mtnt.matches(installable: TestUtils.LexicalModels.mtnt))
    XCTAssertTrue(constructed_mtnt.matches(installable: TestUtils.LexicalModels.mtnt, requireLanguageMatch: false))
  }

  func testKMPMetadataFromResource() throws {
    // https://assertible.com/json-schema-validation#api
    // - Note:  they "do not make any guarantees about the uptime and availability
    //          of the Free JSON Schema Validation API."
    let API_ENDPOINT = URL(string: "https://assertible.com/json")!

    // So, first let's make sure that the API endpoint actually IS available.
    // If not, skip this test.
    let reachable = try Reachability(hostname: "https://assertible.com/json")
    try XCTSkipIf(reachable.connection == .unavailable, "API endpoint for test not available")

    // - build the arguments for the API call

    let constructedMetadata_khmer_angkor = KMPMetadata(from: TestUtils.Keyboards.khmer_angkor)

    let coder = JSONEncoder()
    let codedJSON = try coder.encode(constructedMetadata_khmer_angkor)

    // Does not follow "draft 4" due to an empty array in a 'required' entry.
    // let schemaURL = URL(string: "https://api.keyman.com/schemas/package/1.1.0/package.json")!

    // An appropriately-tweaked version of the above link.  (Just removes the lone, problematic line.)
    let schemaURL = TestUtils.PackageJSON.jsonBundle.url(forResource: "package-schema", withExtension: "json")!
    let schemaData = try Data(contentsOf: schemaURL)

    // - arguments ready, time to build the POST-based request

    // This section brought to you by: https://stackoverflow.com/questions/41997641/how-to-make-nsurlsession-post-request-in-swift
    var request = URLRequest(url: API_ENDPOINT)
    request.httpMethod = "POST"
    request.setValue("Application/json", forHTTPHeaderField: "Content-Type")

    let parameterDictionary = [
      "schema": try JSONSerialization.jsonObject(with: schemaData, options: []),
      "json": try JSONSerialization.jsonObject(with: codedJSON, options: [])
    ]
    request.httpBody = try? JSONSerialization.data(withJSONObject: parameterDictionary, options: [])

    // - and NOW to finally make the API call for the test.

    let expectation = XCTestExpectation(description: "API call return and analysis expected")

    let task = URLSession.shared.dataTask(with: request) { (data, response, error) in
      guard let data = data else {
        XCTFail("Could not complete API call due to error: \(String(describing: error))")
        expectation.fulfill()
        return
      }

      do {
        if let results: [String: Any] = try JSONSerialization.jsonObject(with: data, options: [.allowFragments]) as? [String : Any] {
          if let valid = results["valid"] as? Bool, let errors = results["errors"] as? [String] {
            XCTAssert(valid, "Errors returned from schema validation API call: \(String(describing: errors))")
          } else {
            XCTFail("Unexpected format in return object from API")
          }
        } else {
          XCTFail("Unexpected format in return object from API")
        }
      } catch {
        XCTFail("Error occurred processing returned data - may not be JSON")
      }

      expectation.fulfill()
    }

    task.resume()
    wait(for: [expectation], timeout: 10)
  }
}
