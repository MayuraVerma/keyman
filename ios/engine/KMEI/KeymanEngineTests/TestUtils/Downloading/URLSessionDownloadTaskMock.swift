//
//  URLSessionDownloadTaskMock.swift
//  KeymanEngineTests
//
//  Created by Joshua Horton on 5/27/20.
//  Copyright © 2020 SIL International. All rights reserved.
//

import Foundation

extension TestUtils.Downloading {
  /**
   * Many thanks to https://www.swiftbysundell.com/articles/mocking-in-swift/ for the approach used here.
   */
  class URLSessionDownloadTaskMock: URLSessionDownloadTask {
    private let closure: () -> Void

    init(closure: @escaping () -> Void) {
      self.closure = closure
    }

    /*
     * For mocked DownloadTasks, just use the precomputed completion closure
     * provided to the constructor.
     */
    override func resume() {
      closure()
    }
  }
}
