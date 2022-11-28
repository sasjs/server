## [0.28.1](https://github.com/sasjs/server/compare/v0.28.0...v0.28.1) (2022-11-28)


### Bug Fixes

* update the content type header after the program has been executed ([4dcee4b](https://github.com/sasjs/server/commit/4dcee4b3c3950d402220b8f451c50ad98a317d83))

# [0.28.0](https://github.com/sasjs/server/compare/v0.27.0...v0.28.0) (2022-11-28)


### Bug Fixes

* update the response header of request to stp/execute routes ([112431a](https://github.com/sasjs/server/commit/112431a1b7461989c04100418d67d975a2a8f354))


### Features

* **api:** add the api endpoint for updating user password ([4581f32](https://github.com/sasjs/server/commit/4581f325344eb68c5df5a28492f132312f15bb5c))
* ask for updated password on first login ([1d48f88](https://github.com/sasjs/server/commit/1d48f8856b1fbbf3ef868914558333190e04981f))
* **web:** add the UI for updating user password ([8b8c43c](https://github.com/sasjs/server/commit/8b8c43c21bde5379825c5ec44ecd81a92425f605))

# [0.27.0](https://github.com/sasjs/server/compare/v0.26.2...v0.27.0) (2022-11-17)


### Features

* on startup add webout.sas file in sasautos folder ([200f6c5](https://github.com/sasjs/server/commit/200f6c596a6e732d799ed408f1f0fd92f216ba58))

## [0.26.2](https://github.com/sasjs/server/compare/v0.26.1...v0.26.2) (2022-11-15)


### Bug Fixes

* comments ([7ae862c](https://github.com/sasjs/server/commit/7ae862c5ce720e9483d4728f4295dede4f849436))

## [0.26.1](https://github.com/sasjs/server/compare/v0.26.0...v0.26.1) (2022-11-15)


### Bug Fixes

* change the expiration of access/refresh tokens from days to seconds ([bb05493](https://github.com/sasjs/server/commit/bb054938c5bd0535ae6b9da93ba0b14f9b80ddcd))

# [0.26.0](https://github.com/sasjs/server/compare/v0.25.1...v0.26.0) (2022-11-13)


### Bug Fixes

* **web:** dispose monaco editor actions in return of useEffect ([acc25cb](https://github.com/sasjs/server/commit/acc25cbd686952d3f1c65e57aefcebe1cb859cc7))


### Features

* make access token duration configurable when creating client/secret ([2413c05](https://github.com/sasjs/server/commit/2413c05fea3960f7e5c3c8b7b2f85d61314f08db))
* make refresh token duration configurable ([abd5c64](https://github.com/sasjs/server/commit/abd5c64b4a726e3f17594a98111b6aa269b71fee))

## [0.25.1](https://github.com/sasjs/server/compare/v0.25.0...v0.25.1) (2022-11-07)


### Bug Fixes

* **web:** use mui treeView instead of custom implementation ([c51b504](https://github.com/sasjs/server/commit/c51b50428f32608bc46438e9d7964429b2d595da))

# [0.25.0](https://github.com/sasjs/server/compare/v0.24.0...v0.25.0) (2022-11-02)


### Features

* Enable DRIVE_LOCATION setting for deploying multiple instances of SASjs Server ([1c9d167](https://github.com/sasjs/server/commit/1c9d167f86bbbb108b96e9bc30efaf8de65d82ff))

# [0.24.0](https://github.com/sasjs/server/compare/v0.23.4...v0.24.0) (2022-10-28)


### Features

* cli mock testing ([6434123](https://github.com/sasjs/server/commit/643412340162e854f31fba2f162d83b7ab1751d8))
* mocking sas9 responses with JS STP ([36be3a7](https://github.com/sasjs/server/commit/36be3a7d5e7df79f9a1f3f00c3661b925f462383))

## [0.23.4](https://github.com/sasjs/server/compare/v0.23.3...v0.23.4) (2022-10-11)


### Bug Fixes

* add action to editor ref for running code ([2412622](https://github.com/sasjs/server/commit/2412622367eb46c40f388e988ae4606a7ec239b2))

## [0.23.3](https://github.com/sasjs/server/compare/v0.23.2...v0.23.3) (2022-10-09)


### Bug Fixes

* added domain for session cookies ([94072c3](https://github.com/sasjs/server/commit/94072c3d24a4d0d4c97900dc31bfbf1c9d2559b7))

## [0.23.2](https://github.com/sasjs/server/compare/v0.23.1...v0.23.2) (2022-10-06)


### Bug Fixes

* bump in correct place ([14731e8](https://github.com/sasjs/server/commit/14731e8824fa9f3d1daf89fd62f9916d5e3fcae4))
* bumping sasjs/score ([258cc35](https://github.com/sasjs/server/commit/258cc35f14cf50f2160f607000c60de27593fd79))
* reverting commit ([fda0e0b](https://github.com/sasjs/server/commit/fda0e0b57d56e3b5231e626a8d933343ac0c5cdc))

## [0.23.1](https://github.com/sasjs/server/compare/v0.23.0...v0.23.1) (2022-10-04)


### Bug Fixes

* ldap issues ([4d64420](https://github.com/sasjs/server/commit/4d64420c45424134b4d2014a2d5dd6e846ed03b3))

# [0.23.0](https://github.com/sasjs/server/compare/v0.22.1...v0.23.0) (2022-10-03)


### Features

* Enable SAS_PACKAGES in SASjs Server ([424f0fc](https://github.com/sasjs/server/commit/424f0fc1faec765eb7a14619584e649454105b70))

## [0.22.1](https://github.com/sasjs/server/compare/v0.22.0...v0.22.1) (2022-10-03)


### Bug Fixes

* spelling issues ([3bb0597](https://github.com/sasjs/server/commit/3bb05974d216d69368f4498eb9f309bce7d97fd8))

# [0.22.0](https://github.com/sasjs/server/compare/v0.21.7...v0.22.0) (2022-10-03)


### Bug Fixes

* do not throw error on deleting group when it is created by an external auth provider ([68f0c5c](https://github.com/sasjs/server/commit/68f0c5c5884431e7e8f586dccf98132abebb193e))
* no need to restrict api endpoints when ldap auth is applied ([a142660](https://github.com/sasjs/server/commit/a14266077d3541c7a33b7635efa4208335e73519))
* remove authProvider attribute from user and group payload interface ([bbd7786](https://github.com/sasjs/server/commit/bbd7786c6ce13b374d896a45c23255b8fa3e8bd2))


### Features

* implemented LDAP authentication ([f915c51](https://github.com/sasjs/server/commit/f915c51b077a2b8c4099727355ed914ecd6364bd))

## [0.21.7](https://github.com/sasjs/server/compare/v0.21.6...v0.21.7) (2022-09-30)


### Bug Fixes

* csrf package is changed to pillarjs-csrf ([fe3e508](https://github.com/sasjs/server/commit/fe3e5088f8dfff50042ec8e8aac9ba5ba1394deb))

## [0.21.6](https://github.com/sasjs/server/compare/v0.21.5...v0.21.6) (2022-09-23)


### Bug Fixes

* in getTokensFromDB handle the scenario when tokens are expired ([40f95f9](https://github.com/sasjs/server/commit/40f95f9072c8685910138d88fd2410f8704fc975))

## [0.21.5](https://github.com/sasjs/server/compare/v0.21.4...v0.21.5) (2022-09-22)


### Bug Fixes

* made files extensions case insensitive ([2496043](https://github.com/sasjs/server/commit/249604384e42be4c12c88c70a7dff90fc1917a8f))

## [0.21.4](https://github.com/sasjs/server/compare/v0.21.3...v0.21.4) (2022-09-21)


### Bug Fixes

* removing single quotes from _program value ([a0e7875](https://github.com/sasjs/server/commit/a0e7875ae61cbb6e7d3995d2e36e7300b0daec86))

## [0.21.3](https://github.com/sasjs/server/compare/v0.21.2...v0.21.3) (2022-09-21)


### Bug Fixes

* return same tokens if not expired ([330c020](https://github.com/sasjs/server/commit/330c020933f1080261b38f07d6b627f6d7c62446))

## [0.21.2](https://github.com/sasjs/server/compare/v0.21.1...v0.21.2) (2022-09-20)


### Bug Fixes

* default content-type for sas programs should be text/plain ([9977c9d](https://github.com/sasjs/server/commit/9977c9d161947b11d45ab2513f99a5320a3f5a06))
* **studio:** inject program path to code before sending for execution ([edc2e2a](https://github.com/sasjs/server/commit/edc2e2a302ccea4985f3d6b83ef8c23620ab82b6))

## [0.21.1](https://github.com/sasjs/server/compare/v0.21.0...v0.21.1) (2022-09-19)


### Bug Fixes

* SASJS_WEBOUT_HEADERS path for windows ([0749d65](https://github.com/sasjs/server/commit/0749d65173e8cfe9a93464711b7be1e123c289ff))

# [0.21.0](https://github.com/sasjs/server/compare/v0.20.0...v0.21.0) (2022-09-19)


### Features

* sas9 mocker improved - public access denied scenario ([06d3b17](https://github.com/sasjs/server/commit/06d3b1715432ea245ee755ae1dfd0579d3eb30e9))

# [0.20.0](https://github.com/sasjs/server/compare/v0.19.0...v0.20.0) (2022-09-16)


### Features

* add support for R stored programs ([d6651bb](https://github.com/sasjs/server/commit/d6651bbdbeee5067f53c36e69a0eefa973c523b6))

# [0.19.0](https://github.com/sasjs/server/compare/v0.18.0...v0.19.0) (2022-09-05)


### Features

* added mocking endpoints ([0a0ba2c](https://github.com/sasjs/server/commit/0a0ba2cca5db867de46fb2486d856a84ec68d3b4))

# [0.18.0](https://github.com/sasjs/server/compare/v0.17.5...v0.18.0) (2022-09-02)


### Features

* add option for program launch in context menu ([ee2db27](https://github.com/sasjs/server/commit/ee2db276bb0bbd522f758e0b66f7e7b2f4afd9d5))

## [0.17.5](https://github.com/sasjs/server/compare/v0.17.4...v0.17.5) (2022-09-02)


### Bug Fixes

* SASINITIALFOLDER split over 2 params, closes [#271](https://github.com/sasjs/server/issues/271) ([393b5ea](https://github.com/sasjs/server/commit/393b5eaf990049c39eecf2b9e8dd21a001b6e298))

## [0.17.4](https://github.com/sasjs/server/compare/v0.17.3...v0.17.4) (2022-09-01)


### Bug Fixes

* invalid JS logic ([9f06080](https://github.com/sasjs/server/commit/9f06080348aed076f8188a26fb4890d38a5a3510))

## [0.17.3](https://github.com/sasjs/server/compare/v0.17.2...v0.17.3) (2022-09-01)


### Bug Fixes

* making SASINITIALFOLDER option windows only.  Closes [#267](https://github.com/sasjs/server/issues/267) ([e63271a](https://github.com/sasjs/server/commit/e63271a67a0deb3059a5f2bec1854efee5a6e5a5))

## [0.17.2](https://github.com/sasjs/server/compare/v0.17.1...v0.17.2) (2022-08-31)


### Bug Fixes

* addition of SASINITIALFOLDER startup option.  Closes [#260](https://github.com/sasjs/server/issues/260) ([a5ee2f2](https://github.com/sasjs/server/commit/a5ee2f292384f90e9d95d003d652311c0d91a7a7))

## [0.17.1](https://github.com/sasjs/server/compare/v0.17.0...v0.17.1) (2022-08-30)


### Bug Fixes

* typo mistake ([ee17d37](https://github.com/sasjs/server/commit/ee17d37aa188b0ca43cea0e89d6cd1a566b765cb))

# [0.17.0](https://github.com/sasjs/server/compare/v0.16.1...v0.17.0) (2022-08-25)


### Bug Fixes

* allow underscores in file name ([bce83cb](https://github.com/sasjs/server/commit/bce83cb6fbc98f8198564c9399821f5829acc767))


### Features

* add the functionality of saving file by ctrl + s in editor ([3a3c90d](https://github.com/sasjs/server/commit/3a3c90d9e690ac5267bf1acc834b5b5c5b4dadb6))

## [0.16.1](https://github.com/sasjs/server/compare/v0.16.0...v0.16.1) (2022-08-24)


### Bug Fixes

* update response of /SASjsApi/stp/execute and /SASjsApi/code/execute ([98ea2ac](https://github.com/sasjs/server/commit/98ea2ac9b98631605e39e5900e533727ea0e3d85))

# [0.16.0](https://github.com/sasjs/server/compare/v0.15.3...v0.16.0) (2022-08-17)


### Bug Fixes

* add a new variable _SASJS_WEBOUT_HEADERS to code.js and code.py ([882bedd](https://github.com/sasjs/server/commit/882bedd5d5da22de6ed45c03d0a261aadfb3a33c))
* update content for code.sas file ([02e88ae](https://github.com/sasjs/server/commit/02e88ae7280d020a753bc2c095a931c79ac392d1))
* update default content type for python and js runtimes ([8780b80](https://github.com/sasjs/server/commit/8780b800a34aa618631821e5d97e26e8b0f15806))


### Features

* implement the logic for running python stored programs ([b06993a](https://github.com/sasjs/server/commit/b06993ab9ea24b28d9e553763187387685aaa666))

## [0.15.3](https://github.com/sasjs/server/compare/v0.15.2...v0.15.3) (2022-08-11)


### Bug Fixes

* adding proc printto in precode to enable print output in log.  Closes [#253](https://github.com/sasjs/server/issues/253) ([f8bb732](https://github.com/sasjs/server/commit/f8bb7327a8a4649ac77bb6237e31cea075d46bb9))

## [0.15.2](https://github.com/sasjs/server/compare/v0.15.1...v0.15.2) (2022-08-10)


### Bug Fixes

* remove vulnerabitities ([f27ac51](https://github.com/sasjs/server/commit/f27ac51fc4beb21070d0ab551cfdaec1f6ba39e0))

## [0.15.1](https://github.com/sasjs/server/compare/v0.15.0...v0.15.1) (2022-08-10)


### Bug Fixes

* **web:** fix UI responsiveness ([d99fdd1](https://github.com/sasjs/server/commit/d99fdd1ec7991b94a0d98338d7a7a6216f46ce45))

# [0.15.0](https://github.com/sasjs/server/compare/v0.14.1...v0.15.0) (2022-08-05)


### Bug Fixes

* after selecting file in sidebar collapse sidebar in mobile view ([e215958](https://github.com/sasjs/server/commit/e215958b8b05d7a8ce9d82395e0640b5b37fb40d))
* improve mobile view for studio page ([c67d3ee](https://github.com/sasjs/server/commit/c67d3ee2f102155e2e9781e13d5d33c1ab227cb4))
* improve responsiveness for mobile view ([6ef40b9](https://github.com/sasjs/server/commit/6ef40b954a87ebb0a2621119064f38d58ea85148))
* improve user experience for adding permissions ([7a162ed](https://github.com/sasjs/server/commit/7a162eda8fc60383ff647d93e6611799e2e6af7a))
* show logout button only when user is logged in ([9227cd4](https://github.com/sasjs/server/commit/9227cd449dc46fd960a488eb281804a9b9ffc284))


### Features

* add multiple permission for same combination of type and principal at once ([754704b](https://github.com/sasjs/server/commit/754704bca89ecbdbcc3bd4ef04b94124c4f24167))

## [0.14.1](https://github.com/sasjs/server/compare/v0.14.0...v0.14.1) (2022-08-04)


### Bug Fixes

* **apps:** App Stream logo fix ([87c03c5](https://github.com/sasjs/server/commit/87c03c5f8dbdfc151d4ff3722ecbcd3f7e409aea))
* **cookie:** XSRF cookie is removed and passed token in head section ([77f8d30](https://github.com/sasjs/server/commit/77f8d30baf9b1077279c29f1c3e5ca02a5436bc0))
* **env:** check added for not providing WHITELIST ([5966016](https://github.com/sasjs/server/commit/5966016853369146b27ac5781808cb51d65c887f))
* **web:** show login on logged-out state ([f7fcc77](https://github.com/sasjs/server/commit/f7fcc7741aa2af93a4a2b1e651003704c9bbff0c))

# [0.14.0](https://github.com/sasjs/server/compare/v0.13.3...v0.14.0) (2022-08-02)


### Bug Fixes

* add restriction on  add/remove user to public group ([d3a516c](https://github.com/sasjs/server/commit/d3a516c36e45aa1cc76c30c744e6a0e5bd553165))
* call jwt.verify in synchronous way ([254bc07](https://github.com/sasjs/server/commit/254bc07da744a9708109bfb792be70aa3f6284f4))


### Features

* add public group to DB on seed ([c3e3bef](https://github.com/sasjs/server/commit/c3e3befc17102ee1754e1403193040b4f79fb2a7))
* bypass authentication when route is enabled for public group ([68515f9](https://github.com/sasjs/server/commit/68515f95a65d422e29c0ed6028f3ea0ae8d9b1bf))

## [0.13.3](https://github.com/sasjs/server/compare/v0.13.2...v0.13.3) (2022-08-02)


### Bug Fixes

* show non-admin user his own permissions only ([8a3054e](https://github.com/sasjs/server/commit/8a3054e19ade82e2792cfb0f2a8af9e502c5eb52))
* update schema of Permission ([5d5a9d3](https://github.com/sasjs/server/commit/5d5a9d3788281d75c56f68f0dff231abc9c9c275))

## [0.13.2](https://github.com/sasjs/server/compare/v0.13.1...v0.13.2) (2022-08-01)


### Bug Fixes

* adding ls=max to reduce log size and improve readability ([916947d](https://github.com/sasjs/server/commit/916947dffacd902ff23ac3e899d1bf5ab6238b75))

## [0.13.1](https://github.com/sasjs/server/compare/v0.13.0...v0.13.1) (2022-07-31)


### Bug Fixes

* adding options to prevent unwanted windows on windows.  Closes [#244](https://github.com/sasjs/server/issues/244) ([77db14c](https://github.com/sasjs/server/commit/77db14c690e18145d733ac2b0d646ab0dbe4d521))

# [0.13.0](https://github.com/sasjs/server/compare/v0.12.1...v0.13.0) (2022-07-28)


### Bug Fixes

* autofocus input field and submit on enter ([7681722](https://github.com/sasjs/server/commit/7681722e5afdc2df0c9eed201b05add3beda92a7))
* move api button to user menu ([8de032b](https://github.com/sasjs/server/commit/8de032b5431b47daabcf783c47ff078bf817247d))


### Features

* add action and command to editor ([706e228](https://github.com/sasjs/server/commit/706e228a8e1924786fd9dc97de387974eda504b1))

## [0.12.1](https://github.com/sasjs/server/compare/v0.12.0...v0.12.1) (2022-07-26)


### Bug Fixes

* **web:** disable launch icon button when file content is not saved ([c574b42](https://github.com/sasjs/server/commit/c574b4223591c4a6cd3ef5e146ce99cd8f7c9190))
* **web:** saveAs functionality fixed in studio page ([3c987c6](https://github.com/sasjs/server/commit/3c987c61ddc258f991e2bf38c1f16a0c4248d6ae))
* **web:** show original name as default name in rename file/folder modal ([9640f65](https://github.com/sasjs/server/commit/9640f6526496f3564664ccb1f834d0f659dcad4e))
* **web:** webout tab item fixed in studio page ([7cdffe3](https://github.com/sasjs/server/commit/7cdffe30e36e5cad0284f48ea97925958e12704c))
* **web:** when no file is selected save the editor content to local storage ([3b1fcb9](https://github.com/sasjs/server/commit/3b1fcb937d06d02ab99c9e8dbe307012d48a7a3a))

# [0.12.0](https://github.com/sasjs/server/compare/v0.11.5...v0.12.0) (2022-07-26)


### Bug Fixes

* fileTree api response to include an additional attribute isFolder ([0f19384](https://github.com/sasjs/server/commit/0f193849994f1ac8a071afa8f10af5b46f86663d))
* remove drive component ([06d7c91](https://github.com/sasjs/server/commit/06d7c91fc34620a954df1fd1c682eff370f79ca6))


### Features

* add api end point for delete folder ([08e0c61](https://github.com/sasjs/server/commit/08e0c61e0fd7041d6cded6f4d71fbb410e5615ce))
* add sidebar(drive) to left of studio ([6c35412](https://github.com/sasjs/server/commit/6c35412d2f5180d4e49b12e616576d8b8dacb7d8))
* created api endpoint for adding empty folder in drive ([941917e](https://github.com/sasjs/server/commit/941917e508ece5009135f9dddf99775dd4002f78))
* implemented api for renaming file/folder ([fdcaba9](https://github.com/sasjs/server/commit/fdcaba9d56cddea5d56d7de5a172f1bb49be3db5))
* implemented delete file/folder functionality ([177675b](https://github.com/sasjs/server/commit/177675bc897416f7994dd849dc7bb11ba072efe9))
* implemented functionality for adding file/folder from sidebar context menu ([0ce94a5](https://github.com/sasjs/server/commit/0ce94a553e53bfcdbd6273b26b322095a080a341))
* implemented the functionality for renaming file/folder from context menu ([7010a6a](https://github.com/sasjs/server/commit/7010a6a1201720d0eb4093267a344fb828b90a2f))
* prevent user from leaving studio page when there are unsaved changes ([6c75502](https://github.com/sasjs/server/commit/6c7550286b5f505e9dfe8ca63c62fa1db1b60b2e))
* **web:** add difference view editor in studio ([420a61a](https://github.com/sasjs/server/commit/420a61a5a6b11dcb5eb0a652ea9cecea5c3bee5f))

## [0.11.5](https://github.com/sasjs/server/compare/v0.11.4...v0.11.5) (2022-07-19)


### Bug Fixes

* Revert "fix(security): missing cookie flags are added" ([ce5218a](https://github.com/sasjs/server/commit/ce5218a2278cc750f2b1032024685dc6cd72f796))

## [0.11.4](https://github.com/sasjs/server/compare/v0.11.3...v0.11.4) (2022-07-19)


### Bug Fixes

* **security:** missing cookie flags are added ([526402f](https://github.com/sasjs/server/commit/526402fd73407ee4fa2d31092111a7e6a1741487))

## [0.11.3](https://github.com/sasjs/server/compare/v0.11.2...v0.11.3) (2022-07-19)


### Bug Fixes

* filePath fix in code.js file for windows ([2995121](https://github.com/sasjs/server/commit/299512135d77c2ac9e34853cf35aee6f2e1d4da4))

## [0.11.2](https://github.com/sasjs/server/compare/v0.11.1...v0.11.2) (2022-07-18)


### Bug Fixes

* apply icon option only for sas.exe ([d2ddd8a](https://github.com/sasjs/server/commit/d2ddd8aacadfdd143026881f2c6ae8c6b277610a))

## [0.11.1](https://github.com/sasjs/server/compare/v0.11.0...v0.11.1) (2022-07-18)


### Bug Fixes

* bank operator ([aa02741](https://github.com/sasjs/server/commit/aa027414ed3ce51f1014ef36c4191e064b2e963d))
* ensuring nosplash option only applies for sas.exe ([65e6de9](https://github.com/sasjs/server/commit/65e6de966383fe49a919b1f901d77c7f1e402c9b)), closes [#229](https://github.com/sasjs/server/issues/229)

# [0.11.0](https://github.com/sasjs/server/compare/v0.10.0...v0.11.0) (2022-07-16)


### Bug Fixes

* **logs:** logs location is configurable ([e024a92](https://github.com/sasjs/server/commit/e024a92f165990e08db8aa26ee326dbcb30e2e46))


### Features

* **logs:** logs to file with rotating + code split into files ([92fda18](https://github.com/sasjs/server/commit/92fda183f3f0f3956b7c791669eb8dd52c389d1b))

# [0.10.0](https://github.com/sasjs/server/compare/v0.9.0...v0.10.0) (2022-07-06)


### Bug Fixes

* add authorize middleware for appStreams ([e54a09d](https://github.com/sasjs/server/commit/e54a09db19ec8690e54a40760531a4e06d250974))
* add isAdmin attribute to return response of get session and login requests ([bdf63df](https://github.com/sasjs/server/commit/bdf63df1d915892486005ec904807749786b1c0c))
* add permission authorization middleware to only specific routes ([f3dfc70](https://github.com/sasjs/server/commit/f3dfc7083fbfb4b447521341b1a86730fb90b4c0))
* bumping core and running lint ([a2d1396](https://github.com/sasjs/server/commit/a2d13960578014312d2cb5e03145bfd1829d99ec))
* controller fixed for deleting permission ([b5f595a](https://github.com/sasjs/server/commit/b5f595a25c50550d62482409353c7629c5a5c3e0))
* do not show admin users in add permission modal ([a75edba](https://github.com/sasjs/server/commit/a75edbaa327ec2af49523c13996ac283061da7d8))
* export GroupResponse interface ([38a7db8](https://github.com/sasjs/server/commit/38a7db8514de0acd94d74ba96bc1efb732add30c))
* move permission filter modal to separate file and icons for different actions ([d000f75](https://github.com/sasjs/server/commit/d000f7508f6d7384afffafee4179151fca802ca8))
* principalId type changed to  number from any ([4fcc191](https://github.com/sasjs/server/commit/4fcc191ce9edc7e4dcd8821fb8019f4eea5db4ea))
* remove clientId from principal types ([0781ddd](https://github.com/sasjs/server/commit/0781ddd64e3b5e5ca39647bb4e4e1a9332a0f4f8))
* remove duplicates principals from permission filter modal ([5b319f9](https://github.com/sasjs/server/commit/5b319f9ad1f941b306db6b9473a2128b2e42bf76))
* show loading spinner in studio while executing code ([496247d](https://github.com/sasjs/server/commit/496247d0b9975097a008cf4d3a999d77648fd930))
* show permission component only in server mode ([f863b81](https://github.com/sasjs/server/commit/f863b81a7d40a1296a061ec93946f204382af2c3))
* update permission model ([39fc908](https://github.com/sasjs/server/commit/39fc908de1945f2aaea18d14e6bce703f6bf0c06))
* update permission response ([e516b77](https://github.com/sasjs/server/commit/e516b7716da5ff7e23350a5f77cfa073b1171175))
* **web:** only admin should be able to add, update or delete permission ([be8635c](https://github.com/sasjs/server/commit/be8635ccc5eb34c3f0a5951c8a0421292ef69c97))


### Features

* add api endpoint for deleting permission ([0171344](https://github.com/sasjs/server/commit/01713440a4fa661b76368785c0ca731f096ac70a))
* add api endpoint for updating permission setting ([540f54f](https://github.com/sasjs/server/commit/540f54fb77b364822da7889dbe75c02242f48a59))
* add authorize middleware for validating permissions ([7d916ec](https://github.com/sasjs/server/commit/7d916ec3e9ef579dde1b73015715cd01098c2018))
* add basic UI for settings and permissions ([5652325](https://github.com/sasjs/server/commit/56523254525a66e756196e90b39a2b8cdadc1518))
* add documentation link under usename dropdown menu ([eeb63b3](https://github.com/sasjs/server/commit/eeb63b330c292afcdd5c8f006882b224c4235068))
* add permission model ([6bea1f7](https://github.com/sasjs/server/commit/6bea1f76668ddb070ad95b3e02c31238af67c346))
* add UI for updating permission ([e8c21a4](https://github.com/sasjs/server/commit/e8c21a43b215f5fced0463b70747cda1191a4e01))
* add validation for registering permission ([e5200c1](https://github.com/sasjs/server/commit/e5200c1000903185dfad9ee49c99583e473c4388))
* add, remove and update permissions from web component ([97ecfdc](https://github.com/sasjs/server/commit/97ecfdc95563c72dbdecaebcb504e5194250a763))
* added get authorizedRoutes api endpoint ([b10e932](https://github.com/sasjs/server/commit/b10e9326058193dd65a57fab2d2f05b7b06096e7))
* created modal for adding permission ([1413b18](https://github.com/sasjs/server/commit/1413b1850838ecc988ab289da4541bde36a9a346))
* defined register permission and get all permissions api endpoints ([1103ffe](https://github.com/sasjs/server/commit/1103ffe07b88496967cb03683b08f058ca3bbb9f))
* update swagger docs ([797c2bc](https://github.com/sasjs/server/commit/797c2bcc39005a05a995be15a150d584fecae259))

# [0.9.0](https://github.com/sasjs/server/compare/v0.8.3...v0.9.0) (2022-07-03)


### Features

* removed secrets from env variables ([9c3da56](https://github.com/sasjs/server/commit/9c3da56901672a818f54267f9defc9f4701ab7fb))

## [0.8.3](https://github.com/sasjs/server/compare/v0.8.2...v0.8.3) (2022-07-02)


### Bug Fixes

* **deploy:** extract first json from zip file ([e290751](https://github.com/sasjs/server/commit/e290751c872d24009482871a8c398e834357dcde))

## [0.8.2](https://github.com/sasjs/server/compare/v0.8.1...v0.8.2) (2022-06-22)


### Bug Fixes

* getRuntimeAndFilePath function to handle the scenarion when path is provided with an extension other than runtimes ([5cc85b5](https://github.com/sasjs/server/commit/5cc85b57f80b13296156811fe966d7b37d45f213))

## [0.8.1](https://github.com/sasjs/server/compare/v0.8.0...v0.8.1) (2022-06-21)


### Bug Fixes

* make CA_ROOT optional in getCertificates method ([1b5859e](https://github.com/sasjs/server/commit/1b5859ee37ae73c419115b9debfd5141a79733de))
* update /logout route to /SASLogon/logout ([65380be](https://github.com/sasjs/server/commit/65380be2f3945bae559f1749064845b514447a53))

# [0.8.0](https://github.com/sasjs/server/compare/v0.7.3...v0.8.0) (2022-06-21)


### Features

* **certs:** ENV variables updated and set CA Root for HTTPS server ([2119e9d](https://github.com/sasjs/server/commit/2119e9de9ab1e5ce1222658f554ac74f4f35cf4d))

## [0.7.3](https://github.com/sasjs/server/compare/v0.7.2...v0.7.3) (2022-06-20)


### Bug Fixes

* path descriptions and defaults ([5d5d6ce](https://github.com/sasjs/server/commit/5d5d6ce3265a43af2e22bcd38cda54fafaf7b3ef))

## [0.7.2](https://github.com/sasjs/server/compare/v0.7.1...v0.7.2) (2022-06-20)


### Bug Fixes

* removing UTF-8 options from commandline.  There appears to be no reliable way to enforce ([f6dc74f](https://github.com/sasjs/server/commit/f6dc74f16bddafa1de9c83c2f27671a241abdad4))

## [0.7.1](https://github.com/sasjs/server/compare/v0.7.0...v0.7.1) (2022-06-20)


### Bug Fixes

* default runtime should be sas ([91d29cb](https://github.com/sasjs/server/commit/91d29cb1272c28afbceaf39d1e0a87e17fbfdcd6))
* **Studio:** default selection of runtime fixed ([eb569c7](https://github.com/sasjs/server/commit/eb569c7b827c872ed2c4bc114559b97d87fd2aa0))
* webout path fixed in code.js when running on windows ([99a1107](https://github.com/sasjs/server/commit/99a110736448f66f99a512396b268fc31a3feef0))

# [0.7.0](https://github.com/sasjs/server/compare/v0.6.1...v0.7.0) (2022-06-19)


### Bug Fixes

* add runtimes to global process object ([194eaec](https://github.com/sasjs/server/commit/194eaec7d4a561468f83bf6efce484909ee532eb))
* code fixes for executing program from program path including file extension ([53854d0](https://github.com/sasjs/server/commit/53854d001279462104b24c0e59a8c94ab4938a94))
* code/execute controller logic to handle different runtimes ([23b6692](https://github.com/sasjs/server/commit/23b6692f02e4afa33c9dc95d242eb8645c19d546))
* convert single executeProgram method to two methods i.e. executeSASProgram and executeJSProgram ([c58666e](https://github.com/sasjs/server/commit/c58666eb81514de500519e7b96c1981778ec149b))
* no need to stringify _webout in preProgramVarStatements, developer should have _webout as string in actual code ([9d5a5e0](https://github.com/sasjs/server/commit/9d5a5e051fd821295664ddb3a1fd64629894a44c))
* pass _program to execute file without extension ([5df619b](https://github.com/sasjs/server/commit/5df619b3f63571e8e326261d8114869d33881d91))
* refactor code for session selection in preUploadMiddleware function ([b444381](https://github.com/sasjs/server/commit/b4443819d42afecebc0f382c58afb9010d4775ef))
* refactor code in executeFile method of session controller ([dffe6d7](https://github.com/sasjs/server/commit/dffe6d7121d569e5c7d13023c6ca68d8c901c88e))
* refactor code in preUploadMiddleware function ([6d6bda5](https://github.com/sasjs/server/commit/6d6bda56267babde7b98cf69e32973d56d719f75))
* refactor sas/js session controller classes to inherit from base session controller class ([2c704a5](https://github.com/sasjs/server/commit/2c704a544f4e31a8e8e833a9a62ba016bcfa6c7c))
* **Studio:** style fix for runtime dropdown ([9023cf3](https://github.com/sasjs/server/commit/9023cf33b5fa4b13c2d5e9b80ae307df69c7fc02))


### Features

* configure child process with writeStream to write logs to log file ([058b3b0](https://github.com/sasjs/server/commit/058b3b00816e582e143953c2f0b8330bde2181b8))
* conver single session controller to two controller i.e. SASSessionController and JSSessionController ([07295aa](https://github.com/sasjs/server/commit/07295aa151175db8c93eeef806fc3b7fde40ac72))
* create and inject code for uploaded files to code.js ([1685616](https://github.com/sasjs/server/commit/16856165fb292dc9ffa897189ba105bd9f362267))
* validate sasjs_runtimes env var ([596ada7](https://github.com/sasjs/server/commit/596ada7ca88798d6d71f6845633a006fd22438ea))

## [0.6.1](https://github.com/sasjs/server/compare/v0.6.0...v0.6.1) (2022-06-17)


### Bug Fixes

* home page wording.  Using fix to force previous change through.. ([8702a4e](https://github.com/sasjs/server/commit/8702a4e8fd1bbfaf4f426b75e8b85a87ede0e0b0))

# [0.6.0](https://github.com/sasjs/server/compare/v0.5.0...v0.6.0) (2022-06-16)


### Features

* get group by group name ([6b0b94a](https://github.com/sasjs/server/commit/6b0b94ad38215ae58e62279a4f73ac3ed2d9d0e8))

# [0.5.0](https://github.com/sasjs/server/compare/v0.4.2...v0.5.0) (2022-06-16)


### Bug Fixes

* npm audit fix to avoid warnings on npm i ([28a6a36](https://github.com/sasjs/server/commit/28a6a36bb708b93fb5c2b74d587e9b2e055582be))


### Features

* **api:** deployment through zipped/compressed file ([b81d742](https://github.com/sasjs/server/commit/b81d742c6c70d4cf1cab365b0e3efc087441db00))

## [0.4.2](https://github.com/sasjs/server/compare/v0.4.1...v0.4.2) (2022-06-15)


### Bug Fixes

* appStream redesign ([73792fb](https://github.com/sasjs/server/commit/73792fb574c90bd280c4324e0b41c6fee7d572b6))

## [0.4.1](https://github.com/sasjs/server/compare/v0.4.0...v0.4.1) (2022-06-15)


### Bug Fixes

* add/remove group to User when adding/removing user from group and return group membership on getting user ([e08bbcc](https://github.com/sasjs/server/commit/e08bbcc5435cbabaee40a41a7fb667d4a1f078e6))

# [0.4.0](https://github.com/sasjs/server/compare/v0.3.10...v0.4.0) (2022-06-14)


### Features

* new APIs added for GET|PATCH|DELETE of user by username ([aef411a](https://github.com/sasjs/server/commit/aef411a0eac625c33274dfe3e88b6f75115c44d8))

## [0.3.10](https://github.com/sasjs/server/compare/v0.3.9...v0.3.10) (2022-06-14)


### Bug Fixes

* correct syntax for encoding option ([32d372b](https://github.com/sasjs/server/commit/32d372b42fbf56b6c0779e8f704164eaae1c7548))

## [0.3.9](https://github.com/sasjs/server/compare/v0.3.8...v0.3.9) (2022-06-14)


### Bug Fixes

* forcing utf 8 encoding. Closes [#76](https://github.com/sasjs/server/issues/76) ([8734489](https://github.com/sasjs/server/commit/8734489cf014aedaca3f325e689493e4fe0b71ca))

## [0.3.8](https://github.com/sasjs/server/compare/v0.3.7...v0.3.8) (2022-06-13)


### Bug Fixes

* execution controller better error handling ([8a617a7](https://github.com/sasjs/server/commit/8a617a73ae63233332f5788c90f173d6cd5e1283))
* execution controller error details ([3fa2a7e](https://github.com/sasjs/server/commit/3fa2a7e2e32f90050f6b09e30ce3ef725eb0b15f))

## [0.3.7](https://github.com/sasjs/server/compare/v0.3.6...v0.3.7) (2022-06-08)


### Bug Fixes

* **appstream:** redirect to relative + nested resource should be accessed ([5ab35b0](https://github.com/sasjs/server/commit/5ab35b02c4417132dddb5a800982f31d0d50ef66))

## [0.3.6](https://github.com/sasjs/server/compare/v0.3.5...v0.3.6) (2022-06-02)


### Bug Fixes

* **appstream:** should serve only new files for same app stream name with new deployment ([e6d1989](https://github.com/sasjs/server/commit/e6d1989847761fbe562d7861ffa0ee542839b125))

## [0.3.5](https://github.com/sasjs/server/compare/v0.3.4...v0.3.5) (2022-05-30)


### Bug Fixes

* bumping sasjs/core library ([61815f8](https://github.com/sasjs/server/commit/61815f8ae18be132e17c199cd8e3afbcc2fa0b60))

## [0.3.4](https://github.com/sasjs/server/compare/v0.3.3...v0.3.4) (2022-05-30)


### Bug Fixes

* **web:** system username for DESKTOP mode ([a8ba378](https://github.com/sasjs/server/commit/a8ba378fd1ff374ba025a96fdfae5c6c36954465))

## [0.3.3](https://github.com/sasjs/server/compare/v0.3.2...v0.3.3) (2022-05-30)


### Bug Fixes

* usage of autoexec API in DESKTOP mode ([12d424a](https://github.com/sasjs/server/commit/12d424acce8108a6f53aefbac01fddcdc5efb48f))

## [0.3.2](https://github.com/sasjs/server/compare/v0.3.1...v0.3.2) (2022-05-27)


### Bug Fixes

* **web:** ability to use get/patch User API in desktop mode. ([2c259fe](https://github.com/sasjs/server/commit/2c259fe1de95d84e6929e311aaa6b895e66b42a3))

## [0.3.1](https://github.com/sasjs/server/compare/v0.3.0...v0.3.1) (2022-05-26)


### Bug Fixes

* **api:** username should be lowercase ([5ad6ee5](https://github.com/sasjs/server/commit/5ad6ee5e0f5d7d6faa45b72215f1d9d55cfc37db))
* **web:** reduced width for autoexec input ([7d11cc7](https://github.com/sasjs/server/commit/7d11cc79161e5a07f6c5392d742ef6b9d8658071))

# [0.3.0](https://github.com/sasjs/server/compare/v0.2.0...v0.3.0) (2022-05-25)


### Features

* **web:** added profile + edit + autoexec changes ([c275db1](https://github.com/sasjs/server/commit/c275db184e874f0ee3a4f08f2592cfacf1e90742))

# [0.2.0](https://github.com/sasjs/server/compare/v0.1.0...v0.2.0) (2022-05-25)


### Bug Fixes

* **autoexec:** usage in case of desktop from file ([79dc2db](https://github.com/sasjs/server/commit/79dc2dba23dc48ec218a973119392a45cb3856b5))


### Features

* **api:** added autoexec + major type setting changes ([2a7223a](https://github.com/sasjs/server/commit/2a7223ad7d6b8f3d4682447fd25d9426a7c79ac3))

# [0.1.0](https://github.com/sasjs/server/compare/v0.0.77...v0.1.0) (2022-05-23)


### Bug Fixes

* issue174 + issue175 + issue146 ([80b33c7](https://github.com/sasjs/server/commit/80b33c7a18c1b7727316ffeca71658346733e935))
* **web:** click to copy + notification ([f37f8e9](https://github.com/sasjs/server/commit/f37f8e95d1a85e00ceca2413dbb5e1f3f3f72255))


### Features

* **env:** added new env variable LOG_FORMAT_MORGAN ([53bf68a](https://github.com/sasjs/server/commit/53bf68a6aff44bb7b2f40d40d6554809253a01a8))

## [0.0.77](https://github.com/sasjs/server/compare/v0.0.76...v0.0.77) (2022-05-16)


### Bug Fixes

* **release:** Github workflow without npm token ([c017d13](https://github.com/sasjs/server/commit/c017d13061d21aeacd0690367992d12ca57a115b))

### [0.0.76](https://github.com/sasjs/server/compare/v0.0.75...v0.0.76) (2022-05-16)


### Bug Fixes

* get csrf token from cookie if not present in header ([f89389b](https://github.com/sasjs/server/commit/f89389bbc6f1f8f7060db2bdeb89746cbd60f533))

### [0.0.75](https://github.com/sasjs/server/compare/v0.0.69...v0.0.75) (2022-05-12)


### Features

* CSP_DISABLE env option ([dd3acce](https://github.com/sasjs/server/commit/dd3acce3935e7cfc0b2c44a401314306915a3a10))


### Bug Fixes

* added more cookies to req ([4a8e32d](https://github.com/sasjs/server/commit/4a8e32dd20b540b6dc92d749fad90d6c7fc69376))
* bumping core ([c0b57b9](https://github.com/sasjs/server/commit/c0b57b9e76d6db33fc64a68556a8be979dd69e40))
* csp updates ([7cfa239](https://github.com/sasjs/server/commit/7cfa2398e12c5e515d27c896f36ff91604c2124d))
* helmet config on http mode ([b0fdaaa](https://github.com/sasjs/server/commit/b0fdaaaa79e3135699c51effac0388d8ec5ab23b))
* moved getAuthCode from api to web routes ([b40de8f](https://github.com/sasjs/server/commit/b40de8fa6a5aa763ed25a6fe6a381e483e0ab824))
* reqHeadrs.txt will contain headers to access APIs ([636301e](https://github.com/sasjs/server/commit/636301e664416fb085f704d83deb7f39ee0a91a7))
* **web:** seperate container for auth code ([5888f04](https://github.com/sasjs/server/commit/5888f04e08a32c6d2c7bcfcbc3a1d32425bff3b3))

### [0.0.74](https://github.com/sasjs/server/compare/v0.0.73...v0.0.74) (2022-05-12)


### Bug Fixes

* csp updates ([7cfa239](https://github.com/sasjs/server/commit/7cfa2398e12c5e515d27c896f36ff91604c2124d))

### [0.0.73](https://github.com/sasjs/server/compare/v0.0.72...v0.0.73) (2022-05-10)


### Bug Fixes

* helmet config on http mode ([b0fdaaa](https://github.com/sasjs/server/commit/b0fdaaaa79e3135699c51effac0388d8ec5ab23b))

### [0.0.72](https://github.com/sasjs/server/compare/v0.0.71...v0.0.72) (2022-05-09)

### [0.0.71](https://github.com/sasjs/server/compare/v0.0.70...v0.0.71) (2022-05-07)


### Bug Fixes

* added more cookies to req ([4a8e32d](https://github.com/sasjs/server/commit/4a8e32dd20b540b6dc92d749fad90d6c7fc69376))
* bumping core ([c0b57b9](https://github.com/sasjs/server/commit/c0b57b9e76d6db33fc64a68556a8be979dd69e40))
* reqHeadrs.txt will contain headers to access APIs ([636301e](https://github.com/sasjs/server/commit/636301e664416fb085f704d83deb7f39ee0a91a7))

### [0.0.70](https://github.com/sasjs/server/compare/v0.0.69...v0.0.70) (2022-05-06)


### Features

* CSP_DISABLE env option ([dd3acce](https://github.com/sasjs/server/commit/dd3acce3935e7cfc0b2c44a401314306915a3a10))

### [0.0.69](https://github.com/sasjs/server/compare/v0.0.68...v0.0.69) (2022-05-02)


### Bug Fixes

* **upload:** appStream uses CSRF + Session authentication ([1f89279](https://github.com/sasjs/server/commit/1f8927926405887f3d134c0a1dd6452ffa33876e))

### [0.0.68](https://github.com/sasjs/server/compare/v0.0.67...v0.0.68) (2022-05-02)


### Bug Fixes

* using monaco editor locally ([2548c82](https://github.com/sasjs/server/commit/2548c82dfe1149e62a570a00546dddd9e30049b1))

### [0.0.67](https://github.com/sasjs/server/compare/v0.0.66...v0.0.67) (2022-05-01)

### [0.0.66](https://github.com/sasjs/server/compare/v0.0.64...v0.0.66) (2022-05-01)


### Bug Fixes

* added swagger ui init file manually ([e2a97fc](https://github.com/sasjs/server/commit/e2a97fcb7c54a57a7ca118677cfce93fe9430d8f))
* consume swagger api with CSRF ([5aaac24](https://github.com/sasjs/server/commit/5aaac24080362d6ce0c5d1157798a9343f40ae2a))

### [0.0.65](https://github.com/sasjs/server/compare/v0.0.64...v0.0.65) (2022-05-01)


### Bug Fixes

* consume swagger api with CSRF ([5aaac24](https://github.com/sasjs/server/commit/5aaac24080362d6ce0c5d1157798a9343f40ae2a))

### [0.0.64](https://github.com/sasjs/server/compare/v0.0.63...v0.0.64) (2022-04-30)


### Bug Fixes

* removed fileExists for serving web ([7b39cc0](https://github.com/sasjs/server/commit/7b39cc06d358f5ffecb87955040c4eb0fcc7469e))

### [0.0.63](https://github.com/sasjs/server/compare/v0.0.62...v0.0.63) (2022-04-30)

### [0.0.62](https://github.com/sasjs/server/compare/v0.0.61...v0.0.62) (2022-04-30)

### [0.0.61](https://github.com/sasjs/server/compare/v0.0.59...v0.0.61) (2022-04-30)


### Bug Fixes

* added CSRF check for granting access via session authentication ([b060ad1](https://github.com/sasjs/server/commit/b060ad1b8e0bbc61c20dc25be553bba4cc4d2716))
* setting CSRF Token for only rendering SPA ([b4b60c6](https://github.com/sasjs/server/commit/b4b60c69cf67a42f4797f7f1afe68b7a5eec2998))

### [0.0.60](https://github.com/sasjs/server/compare/v0.0.59...v0.0.60) (2022-04-30)


### Bug Fixes

* added CSRF check for granting access via session authentication ([b060ad1](https://github.com/sasjs/server/commit/b060ad1b8e0bbc61c20dc25be553bba4cc4d2716))
* setting CSRF Token for only rendering SPA ([b4b60c6](https://github.com/sasjs/server/commit/b4b60c69cf67a42f4797f7f1afe68b7a5eec2998))

### [0.0.59](https://github.com/sasjs/server/compare/v0.0.58...v0.0.59) (2022-04-29)


### Features

* enabled csrf tokens for web component ([e462aeb](https://github.com/sasjs/server/commit/e462aebdc01f3c0068ed0074473a2063412dcf45))
* enabled session based authentication for web ([5da93f3](https://github.com/sasjs/server/commit/5da93f318aad10b1c67032a467191e4dbb99f411))


### Bug Fixes

* fetch client from DB for each request ([4ad8c81](https://github.com/sasjs/server/commit/4ad8c81e4927c1a82220ec015a781b095c8e859e))
* **web:** show display name instead of username ([e57443f](https://github.com/sasjs/server/commit/e57443f1ed662a022494bb93d79c3d2f10a2d082))

### [0.0.58](https://github.com/sasjs/server/compare/v0.0.57...v0.0.58) (2022-04-24)


### Bug Fixes

* bumping core library to get latest user management macros ([4862071](https://github.com/sasjs/server/commit/486207128da58fc4866bd0919c1bed2bd98097ea))
* missing dependency ([d09876c](https://github.com/sasjs/server/commit/d09876c05f89166eec20064f7aa7ed5b867be081))

### [0.0.57](https://github.com/sasjs/server/compare/v0.0.56...v0.0.57) (2022-04-21)


### Features

* create AppContext ([84ee743](https://github.com/sasjs/server/commit/84ee743eae16e87eaa91969393bebf01e2d15a44))

### [0.0.56](https://github.com/sasjs/server/compare/v0.0.55...v0.0.56) (2022-04-20)


### Bug Fixes

* shortening min length of username.  Closes [#61](https://github.com/sasjs/server/issues/61) ([f02996f](https://github.com/sasjs/server/commit/f02996facf1019ec4022ccfbc99c1d0137074e1b))

### [0.0.55](https://github.com/sasjs/server/compare/v0.0.53...v0.0.55) (2022-04-20)


### Bug Fixes

* added db seed at server startup ([2e63831](https://github.com/sasjs/server/commit/2e63831b90c7457e0e322719ebb1193fd6181cc3))
* drive path in server mode ([c4cea4a](https://github.com/sasjs/server/commit/c4cea4a12b7eda4daeed995f41c0b10bcea79871))

### [0.0.54](https://github.com/sasjs/server/compare/v0.0.53...v0.0.54) (2022-04-19)


### Bug Fixes

* added db seed at server startup ([2e63831](https://github.com/sasjs/server/commit/2e63831b90c7457e0e322719ebb1193fd6181cc3))

### [0.0.53](https://github.com/sasjs/server/compare/v0.0.49...v0.0.53) (2022-04-19)


### Features

* add api for getting server info ([9fb5f1f](https://github.com/sasjs/server/commit/9fb5f1f8e7d4e2d767cc1ff7285c99514834cf32))
* **appstream:** Upload an app from appStream page ([74ba65f](https://github.com/sasjs/server/commit/74ba65f9f330bf8c98c12a9c66bb60773d5a7b77))
* run button running man, sub menu added ([68e84b0](https://github.com/sasjs/server/commit/68e84b0994a3fa6ff56b07635c637c6e3a57bfda))
* running code with CTRL+ENTER ([b93a0da](https://github.com/sasjs/server/commit/b93a0da3a380926c87548b69309b2d0c1b7e617f))


### Bug Fixes

* provide clientId to web component ([db70b1c](https://github.com/sasjs/server/commit/db70b1ce555df6b29fb09c0c960d38b911c97b1b))
* session death time has to be a valid string number ([23db7e7](https://github.com/sasjs/server/commit/23db7e7b7df2f22bbf7ce16865f83091624d8047))
* web component added tooltip for webout in studio ([61080d4](https://github.com/sasjs/server/commit/61080d4694859306049346d2e3174f27bb6dac16))
* web component UI fix for studio scrolling ([f257602](https://github.com/sasjs/server/commit/f25760283492140cc1f14e51ed27673ec28baaf3))

### [0.0.52](https://github.com/sasjs/server/compare/v0.0.51...v0.0.52) (2022-04-17)


### Features

* add api for getting server info ([9fb5f1f](https://github.com/sasjs/server/commit/9fb5f1f8e7d4e2d767cc1ff7285c99514834cf32))

### [0.0.51](https://github.com/sasjs/server/compare/v0.0.50...v0.0.51) (2022-04-15)


### Features

* run button running man, sub menu added ([68e84b0](https://github.com/sasjs/server/commit/68e84b0994a3fa6ff56b07635c637c6e3a57bfda))
* running code with CTRL+ENTER ([b93a0da](https://github.com/sasjs/server/commit/b93a0da3a380926c87548b69309b2d0c1b7e617f))

### [0.0.50](https://github.com/sasjs/server/compare/v0.0.49...v0.0.50) (2022-04-07)


### Features

* **appstream:** Upload an app from appStream page ([74ba65f](https://github.com/sasjs/server/commit/74ba65f9f330bf8c98c12a9c66bb60773d5a7b77))


### Bug Fixes

* session death time has to be a valid string number ([23db7e7](https://github.com/sasjs/server/commit/23db7e7b7df2f22bbf7ce16865f83091624d8047))
* web component added tooltip for webout in studio ([61080d4](https://github.com/sasjs/server/commit/61080d4694859306049346d2e3174f27bb6dac16))
* web component UI fix for studio scrolling ([f257602](https://github.com/sasjs/server/commit/f25760283492140cc1f14e51ed27673ec28baaf3))

### [0.0.49](https://github.com/sasjs/server/compare/v0.0.48...v0.0.49) (2022-04-02)


### Bug Fixes

* **stp:** read file in non-binary mode if debug one ([527f70e](https://github.com/sasjs/server/commit/527f70e90dd7369766e375ac2d6fc38b2a114d11))

### [0.0.48](https://github.com/sasjs/server/compare/v0.0.47...v0.0.48) (2022-04-02)


### Features

* **deploy:** new route added for deploy with build.json ([18d0604](https://github.com/sasjs/server/commit/18d0604bdd0b20ad468f9345474b4de034ee3a67))


### Bug Fixes

* remove uploaded build.json from temp folder in all cases ([9d167ab](https://github.com/sasjs/server/commit/9d167abe2adb743bca161862b4561bf573182c00))
* **stp:** return log+webout for debug on ([3ff6f5e](https://github.com/sasjs/server/commit/3ff6f5e86581cd2ac23bbe0b8e2c367fbea890ed))

### [0.0.47](https://github.com/sasjs/server/compare/v0.0.46...v0.0.47) (2022-03-29)


### Bug Fixes

* **web:** updated STUDIO log and webout ([f700561](https://github.com/sasjs/server/commit/f700561e1a8d06c18ca2bdbe4605d7ab34f7a761))

### [0.0.46](https://github.com/sasjs/server/compare/v0.0.45...v0.0.46) (2022-03-29)


### Features

* **drive:** GET folder contents API added ([0ac9e4a](https://github.com/sasjs/server/commit/0ac9e4af7d67c4431053e80eb2384bf5bdc3f8b3))

### [0.0.45](https://github.com/sasjs/server/compare/v0.0.43...v0.0.45) (2022-03-29)


### Bug Fixes

* DELETE req cannot have body ([0a5aece](https://github.com/sasjs/server/commit/0a5aeceab560b022197d0c30c3da7f091b261b1e))
* increased req body size ([6dc39c0](https://github.com/sasjs/server/commit/6dc39c0d91ac13d6d9b8c0a2240446bfc45bdd7f))
* proving a PRINT destination during SAS invocation. ([7f4201b](https://github.com/sasjs/server/commit/7f4201ba855743144fa6d3efac2b11e816d4696e)), closes [#111](https://github.com/sasjs/server/issues/111)
* **session:** increased session + bug fixed ([117a53c](https://github.com/sasjs/server/commit/117a53ceeadf487a6326384ae11c10e98646631f))
* **stp:** use same session from file upload ([dd56a95](https://github.com/sasjs/server/commit/dd56a95314f0b61480489118734e45877e1745ef))

### [0.0.44](https://github.com/sasjs/server/compare/v0.0.43...v0.0.44) (2022-03-29)


### Bug Fixes

* DELETE req cannot have body ([0a5aece](https://github.com/sasjs/server/commit/0a5aeceab560b022197d0c30c3da7f091b261b1e))
* increased req body size ([6dc39c0](https://github.com/sasjs/server/commit/6dc39c0d91ac13d6d9b8c0a2240446bfc45bdd7f))
* **session:** increased session + bug fixed ([117a53c](https://github.com/sasjs/server/commit/117a53ceeadf487a6326384ae11c10e98646631f))
* **stp:** use same session from file upload ([dd56a95](https://github.com/sasjs/server/commit/dd56a95314f0b61480489118734e45877e1745ef))

### [0.0.43](https://github.com/sasjs/server/compare/v0.0.42...v0.0.43) (2022-03-23)


### Bug Fixes

* **deploy:** user can deploy to same appName with different/same appLoc ([9ace33d](https://github.com/sasjs/server/commit/9ace33d7830a9def42d741c23b46090afe0c5510))
* fallback logo on AppStream ([5655311](https://github.com/sasjs/server/commit/5655311b9663225823c192b39a03f39d17dda730))

### [0.0.42](https://github.com/sasjs/server/compare/v0.0.41...v0.0.42) (2022-03-23)


### Bug Fixes

* execute api, webout as raw ([9c75187](https://github.com/sasjs/server/commit/9c751877d1ed0d0677aff816169a1df7c34c6bf5))

### [0.0.41](https://github.com/sasjs/server/compare/v0.0.40...v0.0.41) (2022-03-23)


### Bug Fixes

* **scroll:** closes [#100](https://github.com/sasjs/server/issues/100) ([f4eb75f](https://github.com/sasjs/server/commit/f4eb75ff347e78ac334e55ee26fbdd247bb8eaa2))

### [0.0.40](https://github.com/sasjs/server/compare/v0.0.39...v0.0.40) (2022-03-23)


### Bug Fixes

* **deploy:** validating empty file or service in filetree ([27e260e](https://github.com/sasjs/server/commit/27e260e6a453e9978830db63ab669bd48c029897))
* macros available for SAS ([7a70d40](https://github.com/sasjs/server/commit/7a70d40dbf0cd91cb3af156755f10006b860f917))
* moved macros from codebase to drive ([d27e070](https://github.com/sasjs/server/commit/d27e070fc83894854278df22a8223b8016a1f5f7))

### [0.0.39](https://github.com/sasjs/server/compare/v0.0.38...v0.0.39) (2022-03-23)


### Bug Fixes

* included sasjs core macros at compile time ([e680901](https://github.com/sasjs/server/commit/e68090181acd844f86f3e81153cb5a4e3f4a307f))

### [0.0.38](https://github.com/sasjs/server/compare/v0.0.37...v0.0.38) (2022-03-23)


### Bug Fixes

* quick fix for executables ([9e53470](https://github.com/sasjs/server/commit/9e53470947350f4b8d835a2cb6b70e3dabf247c4))

### [0.0.37](https://github.com/sasjs/server/compare/v0.0.36...v0.0.37) (2022-03-23)


### Bug Fixes

* appStream html view ([cd00aa2](https://github.com/sasjs/server/commit/cd00aa2af8c7e0df851050a02152dfeddaec7b0f))
* moved macros from codebase to drive ([9ac3191](https://github.com/sasjs/server/commit/9ac3191891bf53ff07135ccec6ddc83b34ea871a))
* **webin:** closes [#99](https://github.com/sasjs/server/issues/99) ([0147bcb](https://github.com/sasjs/server/commit/0147bcb701a209266144147a3746baf1eb1ccc63))

### [0.0.36](https://github.com/sasjs/server/compare/v0.0.35...v0.0.36) (2022-03-21)


### Features

* App Stream, load on startup, new route added ([98a00ec](https://github.com/sasjs/server/commit/98a00ec7ace5da765f049864799be44ba6538e8a))


### Bug Fixes

* **appstream:** app logo + improvements ([df6003d](https://github.com/sasjs/server/commit/df6003df942fd52b956f3d4069d6d7615441d372))

### [0.0.35](https://github.com/sasjs/server/compare/v0.0.33...v0.0.35) (2022-03-21)


### Features

* **cors:** whitelisting is configurable through .env variables ([99f91fb](https://github.com/sasjs/server/commit/99f91fbce2a029dd963ed30c9007a9b046ea6560))
* **web:** directory tree in sidebar of drive should be expanded by default at root level ([3d89b75](https://github.com/sasjs/server/commit/3d89b753f023beed4d51a64db4f74e1011437aab))


### Bug Fixes

* **cors:** removed trailing slashes of urls ([4fd5bf9](https://github.com/sasjs/server/commit/4fd5bf948e4ad8a274d3176d5509163e67980061))
* desktop mode web index.html js script included ([75291f9](https://github.com/sasjs/server/commit/75291f939770de963d48c2ff1c967da9493bd668))
* preferred to show param errors from query ([fd26298](https://github.com/sasjs/server/commit/fd2629862f10ec16e2266d68420499e715b5d58c))
* **stp:** write original file name in sas code for upload ([8822de9](https://github.com/sasjs/server/commit/8822de95df1d2d01dadfe6957391c254172f2819))
* **web-drive:** upon delete remove entry of deleted file from directory tree in sidebar ([fb77d99](https://github.com/sasjs/server/commit/fb77d99177851e7dc2a71e0b8f516daa3da29e36))

### [0.0.34](https://github.com/sasjs/server/compare/v0.0.33...v0.0.34) (2022-03-18)


### Features

* **web:** directory tree in sidebar of drive should be expanded by default at root level ([3d89b75](https://github.com/sasjs/server/commit/3d89b753f023beed4d51a64db4f74e1011437aab))


### Bug Fixes

* desktop mode web index.html js script included ([75291f9](https://github.com/sasjs/server/commit/75291f939770de963d48c2ff1c967da9493bd668))
* preferred to show param errors from query ([fd26298](https://github.com/sasjs/server/commit/fd2629862f10ec16e2266d68420499e715b5d58c))
* **stp:** write original file name in sas code for upload ([8822de9](https://github.com/sasjs/server/commit/8822de95df1d2d01dadfe6957391c254172f2819))
* **web-drive:** upon delete remove entry of deleted file from directory tree in sidebar ([fb77d99](https://github.com/sasjs/server/commit/fb77d99177851e7dc2a71e0b8f516daa3da29e36))

### [0.0.33](https://github.com/sasjs/server/compare/v0.0.32...v0.0.33) (2022-03-16)


### Features

* serve deployed streaming apps ([d6fa877](https://github.com/sasjs/server/commit/d6fa87794155880adc23c2552c37c86ad606c292))


### Bug Fixes

* adde validation + code improvement ([1ff6965](https://github.com/sasjs/server/commit/1ff6965dd2f44ad74136af04b4fba8c76979ecba))
* added api button on web component ([6b708fc](https://github.com/sasjs/server/commit/6b708fcad30d92c21713f9c97bca173c148cc875))

### [0.0.32](https://github.com/sasjs/server/compare/v0.0.31...v0.0.32) (2022-03-14)


### Features

* **web:** added delete option  in Drive ([7a6e6c8](https://github.com/sasjs/server/commit/7a6e6c8becab31410d0a36bcc22e13d5359a6cdf))

### [0.0.31](https://github.com/sasjs/server/compare/v0.0.30...v0.0.31) (2022-03-14)


### Features

* **drive:** new route delete file api ([3d583ff](https://github.com/sasjs/server/commit/3d583ff21d344a71aa861c7e5b1426ebc2d54c22))


### Bug Fixes

* added cookie for accessToken ([698180a](https://github.com/sasjs/server/commit/698180ab7e44d67d46c84352ececca5b6c83b230))
* **drive:** update file API is same as create file ([7072e28](https://github.com/sasjs/server/commit/7072e282b1cd1a296d81512c57130237610c1c1e))
* show content of get file api ([6ab42ca](https://github.com/sasjs/server/commit/6ab42ca4868366874f5f21bd711b7b8b72e36774))
* **stp:** return plain/text header for GET & debug ([145ac45](https://github.com/sasjs/server/commit/145ac450365ed39279248ec9321bbe4918bee9fa))

### [0.0.30](https://github.com/sasjs/server/compare/v0.0.29...v0.0.30) (2022-03-05)


### Features

* parse log to array ([c5ad72c](https://github.com/sasjs/server/commit/c5ad72c931ec8fbd7d5a6475838adcbd380c8aee))
* set response headers provded by SAS Code execution ([2c4aa42](https://github.com/sasjs/server/commit/2c4aa420b3119890cafde4265ed5dddbc9d6a636))


### Bug Fixes

* added http headers to /code api as well ([da899b9](https://github.com/sasjs/server/commit/da899b90e26d5ee393eefc302be985eb7c9055a5))
* code api is updated return type ([e2a6810](https://github.com/sasjs/server/commit/e2a6810e9531a8102d3c51fd8df2e1f78f0d965f))
* **file:** fixes response headers ([ef41691](https://github.com/sasjs/server/commit/ef41691e408ef1c1c7a921cc1050bdd533651331))
* get file instead of it's content ([efaf38d](https://github.com/sasjs/server/commit/efaf38d3039391392ce0e14a3accddd8f34ea7d6))
* hot fix for web component ([0a4b202](https://github.com/sasjs/server/commit/0a4b202428e14effc8014a6813cecf7761ce3715))
* improvement in flow of uploading ([8c1941a](https://github.com/sasjs/server/commit/8c1941a87bc184be4e0e09eeff73fc6cb69e3041))
* macros are available Sessions with SASAUTOS ([95843fa](https://github.com/sasjs/server/commit/95843fa4c711aa695ee63ad265b8def4ba56360d))
* minor changes ([0b5f958](https://github.com/sasjs/server/commit/0b5f958f456d291ec7a8697236657c7819d5c654))
* multi-part file upload + validations + specs ([e60f172](https://github.com/sasjs/server/commit/e60f17268d1fa9ab623313026d46bd3f63756f69))
* organized code for usage of multer ([ce0a5e1](https://github.com/sasjs/server/commit/ce0a5e1229bed69c450061fac2bc19711448da56))
* return buffer in case of file response ([3e6234e](https://github.com/sasjs/server/commit/3e6234e6019c5f3ae4280fac079ecc9cb0effc07))
* **stp:** return json for webout ([5005f20](https://github.com/sasjs/server/commit/5005f203b8d6b1d577cdf094b83886bd1fc817a2))
* updating docs ([7312763](https://github.com/sasjs/server/commit/7312763339d6769826328561e2c8d11bbfc0c9f4))
* **upload:** added query param as well for filepath ([feeec4e](https://github.com/sasjs/server/commit/feeec4eb149e9a47e5a52320d1fc95243bf5eb15))

### [0.0.29](https://github.com/sasjs/server/compare/v0.0.28...v0.0.29) (2022-02-16)


### Bug Fixes

* adding .. in folder path ([5931fc1](https://github.com/sasjs/server/commit/5931fc1e712c545ef80454dea5b36e684017c367))
* adding sasjs stpsrv_header() path to autoexec.  Relates to [#58](https://github.com/sasjs/server/issues/58) ([ce9bde5](https://github.com/sasjs/server/commit/ce9bde5717369de2d76dc183319be8830b2362b2))

### [0.0.28](https://github.com/sasjs/server/compare/v0.0.27...v0.0.28) (2022-02-16)


### Features

* default macros and bumping core ([6f19d3d](https://github.com/sasjs/server/commit/6f19d3d0ea3815815f246a3e455495c72c8604c7))


### Bug Fixes

* moving core ([f10138b](https://github.com/sasjs/server/commit/f10138b0f2005a958f63cb3a8351e1afa52f086a))

### [0.0.27](https://github.com/sasjs/server/compare/v0.0.26...v0.0.27) (2022-02-16)


### Features

* removing stpsrv_header and updating README with auth details ([d3674c7](https://github.com/sasjs/server/commit/d3674c7f9449d77977e482cd63ccdf7e974fa838))
* **stp-execution:** add returnLog option to execution query ([bf5767e](https://github.com/sasjs/server/commit/bf5767eadfb87f7ed902659347a18361a6a6c74b))

### [0.0.26](https://github.com/sasjs/server/compare/v0.0.25...v0.0.26) (2022-02-14)


### Bug Fixes

* refactored + removed unused package ([d7e1aca](https://github.com/sasjs/server/commit/d7e1aca7e33c3264c784d406fa766e29a6b15ae9))
* release should also has https protocol ([0cfe724](https://github.com/sasjs/server/commit/0cfe724ffa089b84a9f8bca49c9033b56f51c9cb))
* updated token expiry times ([d17a3dd](https://github.com/sasjs/server/commit/d17a3dd5900d5eb88120af8575e3fc7c2cb71ed6))

### [0.0.25](https://github.com/sasjs/server/compare/v0.0.24...v0.0.25) (2022-02-11)


### Bug Fixes

* adding global macvar and bumping sasjs/core with additional server support ([404f1ec](https://github.com/sasjs/server/commit/404f1ec0593a027ed5e84b1d6a84cb9f2d09d99e))

### [0.0.24](https://github.com/sasjs/server/compare/v0.0.23...v0.0.24) (2022-02-11)


### Bug Fixes

* removing sysmacdelete ([480ee4d](https://github.com/sasjs/server/commit/480ee4da831d2a89888c58ebec26bd89802ee2f5))

### [0.0.23](https://github.com/sasjs/server/compare/v0.0.22...v0.0.23) (2022-02-08)

### [0.0.22](https://github.com/sasjs/server/compare/v0.0.17...v0.0.22) (2022-02-08)


### Bug Fixes

* adding missing global vars to autoexec ([1966b17](https://github.com/sasjs/server/commit/1966b17f27e66bf1c9673ef6e1c11f4868b4f816))
* avoid uninitialised note ([e4c027a](https://github.com/sasjs/server/commit/e4c027ad5121302b9ae093b2b76dc27f51a94365))
* bumping core version ([a8df5f4](https://github.com/sasjs/server/commit/a8df5f4afd6c4522270d0a60ab8153dfbdf79e16))
* bumping sasjs/core and updating descriptions ([31532c0](https://github.com/sasjs/server/commit/31532c0efa41e53f87377a2c7c41d21c7909e3a0))
* compressing release files for faster download times ([d8b75a4](https://github.com/sasjs/server/commit/d8b75a47d305e0772ccbf8837ba4d7347b94cc93))
* fixing versioning blooper ([a3b57f6](https://github.com/sasjs/server/commit/a3b57f6e28448fe98e634383041a5633541c8c02))

### [0.0.21](https://github.com/sasjs/server/compare/v0.0.20...v0.0.21) (2022-02-01)


### Bug Fixes

* avoid uninitialised note ([e4c027a](https://github.com/sasjs/server/commit/e4c027ad5121302b9ae093b2b76dc27f51a94365))

### [0.0.20](https://github.com/sasjs/server/compare/v0.0.2...v0.0.20) (2022-01-20)


### Bug Fixes

* fixing versioning blooper ([a3b57f6](https://github.com/sasjs/server/commit/a3b57f6e28448fe98e634383041a5633541c8c02))

### [0.0.19](https://github.com/sasjs/server/compare/v0.0.18...v0.0.19) (2022-01-20)


### Bug Fixes

* bumping sasjs/core and updating descriptions ([31532c0](https://github.com/sasjs/server/commit/31532c0efa41e53f87377a2c7c41d21c7909e3a0))

### [0.0.18](https://github.com/sasjs/server/compare/v0.0.17...v0.0.18) (2022-01-08)


### Bug Fixes

* compressing release files for faster download times ([d8b75a4](https://github.com/sasjs/server/commit/d8b75a47d305e0772ccbf8837ba4d7347b94cc93))

### [0.0.17](https://github.com/sasjs/server/compare/v0.0.16...v0.0.17) (2022-01-07)


### Bug Fixes

* bug removed, log is clean now ([43769e7](https://github.com/sasjs/server/commit/43769e711d37a4f670786545630139a2d926dc76))

### [0.0.16](https://github.com/sasjs/server/compare/v0.0.15...v0.0.16) (2022-01-07)


### Bug Fixes

* added sas9 server address ([cd83891](https://github.com/sasjs/server/commit/cd838915fdb216ee364ea677747409311b1214fb))
* recreate crashed session ([6cbc657](https://github.com/sasjs/server/commit/6cbc657da3eb7fa821a678443a3ae4079c2a1f09))
* session should be marked as consumed ([7a3d710](https://github.com/sasjs/server/commit/7a3d710153f37d12160ff45f8f97fb4fcc75d684))

### [0.0.15](https://github.com/sasjs/server/compare/v0.0.14...v0.0.15) (2022-01-06)


### Bug Fixes

* **studio:** web component updated ([2d77222](https://github.com/sasjs/server/commit/2d77222ae8a139acd9d96466d0e68291c4ebd70e))
* updated route for sas code ([e1eb044](https://github.com/sasjs/server/commit/e1eb04494a5650726c95990f74fc719eced4ccb5))
* **web:** autosave and autofocus ([51ee8c0](https://github.com/sasjs/server/commit/51ee8c0825f021d1d67b2d765d5b434cbf248a1f))
* **web:** parsing of webout ([a115160](https://github.com/sasjs/server/commit/a1151606f21e0007e2b1ca1245d592d96866f62a))
* **web:** sticky tabs on Studio + extra run code button removed ([450d99f](https://github.com/sasjs/server/commit/450d99f06e5929eb1679e6203284e4faa44e19b0))

### [0.0.14](https://github.com/sasjs/server/compare/v0.0.13...v0.0.14) (2021-12-19)


### Bug Fixes

* actually a README change, the fix was in the previous commit (updating ms_webout) that should have been a PR, to trigger a release ([d86c841](https://github.com/sasjs/server/commit/d86c841f1fb94455ac3500f215a42b4acb8b0017))
* bumping sasjs/core with adjustment to ms_webout() ([076b866](https://github.com/sasjs/server/commit/076b866c020fb017512c2764801022a57fe4cca8))
* switch to main branch ([ceca370](https://github.com/sasjs/server/commit/ceca370e2757baf2e8ebb90dab6dfd27f7b990fc))

### [0.0.13](https://github.com/sasjs/server/compare/v0.0.12...v0.0.13) (2021-12-16)


### Features

* **studio:** run selected code + open in studio ([27129a8](https://github.com/sasjs/server/commit/27129a8921084c72968383fdbc2ecbd2f417456c))


### Bug Fixes

* output for Studio ([e5be0e6](https://github.com/sasjs/server/commit/e5be0e678965b05c64bcc8f55c48a366e0ff55a3))

### [0.0.12](https://github.com/sasjs/server/compare/v0.0.11...v0.0.12) (2021-12-15)


### Bug Fixes

* use env if provided for desktop mode ([d19ce25](https://github.com/sasjs/server/commit/d19ce253b4e2d2a7dd912d43a553d4c1bd60ba58))

### [0.0.11](https://github.com/sasjs/server/compare/v0.0.10...v0.0.11) (2021-12-15)


### Features

* added authorization route for web ([#37](https://github.com/sasjs/server/issues/37)) ([d0a1457](https://github.com/sasjs/server/commit/d0a1457f44a3d8993b57106e5e681c4e51fe8e7d))

### [0.0.10](https://github.com/sasjs/server/compare/v0.0.9...v0.0.10) (2021-12-07)

### [0.0.9](https://github.com/sasjs/server/compare/v0.0.3...v0.0.9) (2021-12-07)


### Bug Fixes

* release with files ([#35](https://github.com/sasjs/server/issues/35)) ([a0822e6](https://github.com/sasjs/server/commit/a0822e6b61905257475121ffd907fd1f79ed146b))

### [0.0.8](https://github.com/saadjutt01/server/compare/v0.0.7...v0.0.8) (2021-12-07)

### [0.0.7](https://github.com/saadjutt01/server/compare/v0.0.6...v0.0.7) (2021-12-07)

### [0.0.6](https://github.com/saadjutt01/server/compare/v0.0.5...v0.0.6) (2021-12-07)

### [0.0.5](https://github.com/saadjutt01/server/compare/v0.0.4...v0.0.5) (2021-12-07)

### 0.0.4 (2021-12-07)


### Features

* add api endpoint for sasjs drive ([96b5fef](https://github.com/saadjutt01/server/commit/96b5fef3021f67f66e5e3b854319230618421852))
* add new type TreeNode ([bc3cb7b](https://github.com/saadjutt01/server/commit/bc3cb7bb20a1202d17aaf8bbcddd1feef4fff724))
* add pug and directory tree dependencies ([3ffa168](https://github.com/saadjutt01/server/commit/3ffa168c8bafc989caf1a744cebc20d36c6aa11b))
* add sasjsExecutor controller ([279fbf2](https://github.com/saadjutt01/server/commit/279fbf2a9a0bd6bc0938f9a66e9685fb93d86089))
* add top app bar with tab navigation ([a506bc9](https://github.com/saadjutt01/server/commit/a506bc9dd9d201b89fc9ffd1a552c16bd170f058))
* add views and styles for rendering html ([a446f5c](https://github.com/saadjutt01/server/commit/a446f5c4f73a4e829a2c5eec041e3adffeddff52))
* adding _metaperson and _metauser to Stored Programs ([b3147ec](https://github.com/saadjutt01/server/commit/b3147ec680646b3d9c7e89152e472dddc8a36075))
* **api-utility:** create getWebBuildFolderPath utility ([9648c51](https://github.com/saadjutt01/server/commit/9648c51b5491d8b6bbe5497273efa2d11e2486d2))
* **api:** set up endpoint for sas code execution ([f6046b1](https://github.com/saadjutt01/server/commit/f6046b15ae30cd8ace685cf283339871de658b7d))
* authentication with jwt ([22dfcfd](https://github.com/saadjutt01/server/commit/22dfcfddb9abd355a63d1ee5acd925c759e86d69))
* compile systemInit and inject to autoExec ([b75139d](https://github.com/saadjutt01/server/commit/b75139dda5cacc7e10a4d635eb2a222f7dfa3fec))
* **deploy:** add appLoc ([f0f1e1d](https://github.com/saadjutt01/server/commit/f0f1e1d57ea1e961fc3b1cfcbd4cb259a77a90d0))
* **deploy:** add route to deploy a file tree to @sasjs/server ([b4bf72f](https://github.com/saadjutt01/server/commit/b4bf72f70401a81b6d5d0104332a1fbc5f71562b))
* **execute:** add macroVars to job execution ([39e486b](https://github.com/saadjutt01/server/commit/39e486b8cb5efbadc86eb7029b60c7073744eb2b))
* **execute:** add sas controller ([bf1db4d](https://github.com/saadjutt01/server/commit/bf1db4dd47d2488bac073cd468db920ff9fd533d))
* **execution:** add ExecutionController working with session ([8b25641](https://github.com/saadjutt01/server/commit/8b2564120def137f80647064e28062b880d58efe))
* **executor:** improved api response ([707b503](https://github.com/saadjutt01/server/commit/707b50394267217e717aa72f74dbeba3852a93e6))
* **executor:** response with webout ([52275ba](https://github.com/saadjutt01/server/commit/52275ba67d97d5cbdf6c5511c9bd789bd6ca6b4e))
* **express:** increase payload max size ([7b403c1](https://github.com/saadjutt01/server/commit/7b403c151e889cae975944546bb4bb53eff1dd26))
* frontend app for sasjs server ([db8eb8d](https://github.com/saadjutt01/server/commit/db8eb8dd7197bbe36f2d10cabbb58b3eb7ce7c33))
* generate executables for sasjs/server with web component ([514a262](https://github.com/saadjutt01/server/commit/514a262340dc34007de75caf08ad03969e7110c1))
* Groups are added + docs ([2fe9d5c](https://github.com/saadjutt01/server/commit/2fe9d5ca9ce1fb376f03534f8685d65efb2f68a6))
* improved deploy and execute endpoints ([5b4e562](https://github.com/saadjutt01/server/commit/5b4e5626fc7ae3e020819e3ebd334cc3712ae8e7))
* JWT saved in DB + logout api added ([46c5a75](https://github.com/saadjutt01/server/commit/46c5a75ac4fb26ebec219118eb204f1b5049ae90))
* **routes:** separate routes into web and api ([dabef59](https://github.com/saadjutt01/server/commit/dabef597287a59f3bfaff54a18de465f820aa514))
* **session:** add SessionController ([6a34fa1](https://github.com/saadjutt01/server/commit/6a34fa1b1dae07fe032352bea0644ab7a6f9c3f9))
* **session:** add SessionController and ExecutionController ([6e0b04a](https://github.com/saadjutt01/server/commit/6e0b04a6e548ac31baee726c9249b7e25f50f0bf))
* user operation apis added ([728f277](https://github.com/saadjutt01/server/commit/728f277f5ce136d62951071833cd6db478b07e4a))


### Bug Fixes

* **api-cdrive-oller:** throw erow error when file not found ([03d1d60](https://github.com/saadjutt01/server/commit/03d1d60660fc46421ef6ad9cee8493dd884e309a))
* change api endpoint SASjsExecutor/do -> SASjsApi/stp/execute ([d93673f](https://github.com/saadjutt01/server/commit/d93673f2a51098c6af8abc4a793081d4591e27de))
* cors enabled for desktop mode ([2bb10c7](https://github.com/saadjutt01/server/commit/2bb10c71661b5de7ed515c82e5b1967b88449972))
* DB names updates + refresh api is added ([9f17b17](https://github.com/saadjutt01/server/commit/9f17b17e3138ce49f24447cd5ae457e3e90ad4da))
* debug not passed ([d9555e1](https://github.com/saadjutt01/server/commit/d9555e151b0e1d1a4068efdf8ee9ed53b25b9b89))
* **deploy:** fix payload processing ([361b539](https://github.com/saadjutt01/server/commit/361b539271cf95bbe570cca9e44635ab563d3f9e))
* **deps:** removed malicious dependency ([c4b9402](https://github.com/saadjutt01/server/commit/c4b9402f017b76dc412a17a10313f1fd5a3891ef))
* **docker:** docker-compose for prod+development ([4a363c5](https://github.com/saadjutt01/server/commit/4a363c5b9796283199debcc8afa810c6f561f8e6))
* **executor:** create tmp files before execution ([cdbc3fd](https://github.com/saadjutt01/server/commit/cdbc3fd298e2a581773448bdddcad93de3b3544d))
* **executor:** fix nosplash argument and api response ([715b1de](https://github.com/saadjutt01/server/commit/715b1dec68377eefe03aa8203a73debe77842436))
* fix web route ([6c7a6b6](https://github.com/saadjutt01/server/commit/6c7a6b6c6af28c29b391162e4e332da6524b1c61))
* **github:** fixed github flow ([8dab288](https://github.com/saadjutt01/server/commit/8dab28861dfa7c4c7fefc7fe038df50f58d04547))
* **github:** removed npm token ([bbb94d6](https://github.com/saadjutt01/server/commit/bbb94d61ce39c84a6c0c44186e89787ab0e76a8c))
* immplementation of files api fixed ([299319e](https://github.com/saadjutt01/server/commit/299319e2dbe06c7ca99e403fcbdec2ad1db8b7e4))
* load file when url contains filePath ([99d5577](https://github.com/saadjutt01/server/commit/99d55775aaac3b2caaa4b10d4ed698f6cd7fcb2a))
* modify the directory tree algorithm to include relative path with each node ([91e2e2b](https://github.com/saadjutt01/server/commit/91e2e2bc4a46da0d149578593559efdb87681bd4))
* norefferer issue in home page external links fix ([e2b12b7](https://github.com/saadjutt01/server/commit/e2b12b74f52c3ce4541fde9af6af0093b56b157b))
* on clicking  execute button open new tab for response ([02f5371](https://github.com/saadjutt01/server/commit/02f5371f57b311ff700ba8108f9d5168da8c22a4))
* prettier ([716ae81](https://github.com/saadjutt01/server/commit/716ae81d9293b42dd2a7047ac52d75401b3b8798))
* **prod-server:** use port from configuration ([4d8efbb](https://github.com/saadjutt01/server/commit/4d8efbb88d32154d84e80b79780e2e3de2f519e4))
* readme overview| ([b3342f0](https://github.com/saadjutt01/server/commit/b3342f00031d19080fb72e3460f023c5f44bac95))
* remove .sas extension from _program parameter at the end of string ([56cb2d1](https://github.com/saadjutt01/server/commit/56cb2d1d512beadb5cfdc4ab4034ac917311ff23))
* removing renegade dash ([4ff4d39](https://github.com/saadjutt01/server/commit/4ff4d39e954e895b46ddc3e2919f7f2c4e1ce01d))
* **root-package.json:** lint:fix command fixed in root package json ([ec6333f](https://github.com/saadjutt01/server/commit/ec6333f6aa67c1b94f54b017ed27eb3b21b4207f))
* **routes:** fix routes imports ([49c152a](https://github.com/saadjutt01/server/commit/49c152a398b60f6b0a0c25a68eb4c1c291984872))
* **semantic-release:** fixed package.json ([ef45787](https://github.com/saadjutt01/server/commit/ef45787019f1e61d0e4e2acee334236e8aca23cc))
* sending _webout as result object in response JSON ([b97523e](https://github.com/saadjutt01/server/commit/b97523e55584cc7d9d682cfeaab8f5b70a10b899))
* session refactoring with Saad & Allan ([cbe07b4](https://github.com/saadjutt01/server/commit/cbe07b4abb2e936037874af1a088cd038e0fc731))
* **ts:** enable files ([37b6936](https://github.com/saadjutt01/server/commit/37b6936cca3cff9c1ca26ec7b4b938a357c448df))
* update api calls from client side ([031e492](https://github.com/saadjutt01/server/commit/031e492d44674dec4f2b3bc1f5bf7affac5716bd))
* update api endpoints ([936a205](https://github.com/saadjutt01/server/commit/936a205e66073b9178089c6ab10d6ac3bf323c54))
* update sasjs drive controller from function base to class base ([3fe475d](https://github.com/saadjutt01/server/commit/3fe475d477c466556659b48c70eeac5153ff5b0e))
* update SASjsApi/stp/execute post api endpoints to capture url params ([d981444](https://github.com/saadjutt01/server/commit/d9814441bb1d269ec2404e50f51124f998c65c40))
* use hash router instead of browser router in react app ([c72867d](https://github.com/saadjutt01/server/commit/c72867d5a70550660c8c37220aa33693716a93f1))
* **web:** infinite call to api end point fixed ([ac745c8](https://github.com/saadjutt01/server/commit/ac745c8f5c3e4aa2ac8d6ca23bb1276452d4018b))
* **web:** remove unnecessary packages and files ([0fb4301](https://github.com/saadjutt01/server/commit/0fb43019668f5a13f6e77fdb4b3e543006b509c0))
* **weeb:** add catch block with each axios request ([552a358](https://github.com/saadjutt01/server/commit/552a3584ec9345bc1dec0ff5377bf773a7928d62))
* **workflow:** fix 'SASjs Server Build' ([174d94a](https://github.com/saadjutt01/server/commit/174d94a23c5036d61a4f2e11296283f128d4dafa))

### 0.0.3 (2021-11-30)


### Features

* add api endpoint for sasjs drive ([96b5fef](https://github.com/sasjs/server/commit/96b5fef3021f67f66e5e3b854319230618421852))
* add new type TreeNode ([bc3cb7b](https://github.com/sasjs/server/commit/bc3cb7bb20a1202d17aaf8bbcddd1feef4fff724))
* add pug and directory tree dependencies ([3ffa168](https://github.com/sasjs/server/commit/3ffa168c8bafc989caf1a744cebc20d36c6aa11b))
* add sasjsExecutor controller ([279fbf2](https://github.com/sasjs/server/commit/279fbf2a9a0bd6bc0938f9a66e9685fb93d86089))
* add top app bar with tab navigation ([a506bc9](https://github.com/sasjs/server/commit/a506bc9dd9d201b89fc9ffd1a552c16bd170f058))
* add views and styles for rendering html ([a446f5c](https://github.com/sasjs/server/commit/a446f5c4f73a4e829a2c5eec041e3adffeddff52))
* adding _metaperson and _metauser to Stored Programs ([b3147ec](https://github.com/sasjs/server/commit/b3147ec680646b3d9c7e89152e472dddc8a36075))
* **api-utility:** create getWebBuildFolderPath utility ([9648c51](https://github.com/sasjs/server/commit/9648c51b5491d8b6bbe5497273efa2d11e2486d2))
* **api:** set up endpoint for sas code execution ([f6046b1](https://github.com/sasjs/server/commit/f6046b15ae30cd8ace685cf283339871de658b7d))
* authentication with jwt ([22dfcfd](https://github.com/sasjs/server/commit/22dfcfddb9abd355a63d1ee5acd925c759e86d69))
* compile systemInit and inject to autoExec ([b75139d](https://github.com/sasjs/server/commit/b75139dda5cacc7e10a4d635eb2a222f7dfa3fec))
* **deploy:** add appLoc ([f0f1e1d](https://github.com/sasjs/server/commit/f0f1e1d57ea1e961fc3b1cfcbd4cb259a77a90d0))
* **deploy:** add route to deploy a file tree to @sasjs/server ([b4bf72f](https://github.com/sasjs/server/commit/b4bf72f70401a81b6d5d0104332a1fbc5f71562b))
* **execute:** add macroVars to job execution ([39e486b](https://github.com/sasjs/server/commit/39e486b8cb5efbadc86eb7029b60c7073744eb2b))
* **execute:** add sas controller ([bf1db4d](https://github.com/sasjs/server/commit/bf1db4dd47d2488bac073cd468db920ff9fd533d))
* **execution:** add ExecutionController working with session ([8b25641](https://github.com/sasjs/server/commit/8b2564120def137f80647064e28062b880d58efe))
* **executor:** improved api response ([707b503](https://github.com/sasjs/server/commit/707b50394267217e717aa72f74dbeba3852a93e6))
* **executor:** response with webout ([52275ba](https://github.com/sasjs/server/commit/52275ba67d97d5cbdf6c5511c9bd789bd6ca6b4e))
* **express:** increase payload max size ([7b403c1](https://github.com/sasjs/server/commit/7b403c151e889cae975944546bb4bb53eff1dd26))
* frontend app for sasjs server ([db8eb8d](https://github.com/sasjs/server/commit/db8eb8dd7197bbe36f2d10cabbb58b3eb7ce7c33))
* generate executables for sasjs/server with web component ([514a262](https://github.com/sasjs/server/commit/514a262340dc34007de75caf08ad03969e7110c1))
* Groups are added + docs ([2fe9d5c](https://github.com/sasjs/server/commit/2fe9d5ca9ce1fb376f03534f8685d65efb2f68a6))
* improved deploy and execute endpoints ([5b4e562](https://github.com/sasjs/server/commit/5b4e5626fc7ae3e020819e3ebd334cc3712ae8e7))
* JWT saved in DB + logout api added ([46c5a75](https://github.com/sasjs/server/commit/46c5a75ac4fb26ebec219118eb204f1b5049ae90))
* **routes:** separate routes into web and api ([dabef59](https://github.com/sasjs/server/commit/dabef597287a59f3bfaff54a18de465f820aa514))
* **session:** add SessionController ([6a34fa1](https://github.com/sasjs/server/commit/6a34fa1b1dae07fe032352bea0644ab7a6f9c3f9))
* **session:** add SessionController and ExecutionController ([6e0b04a](https://github.com/sasjs/server/commit/6e0b04a6e548ac31baee726c9249b7e25f50f0bf))
* user operation apis added ([728f277](https://github.com/sasjs/server/commit/728f277f5ce136d62951071833cd6db478b07e4a))


### Bug Fixes

* **api-cdrive-oller:** throw erow error when file not found ([03d1d60](https://github.com/sasjs/server/commit/03d1d60660fc46421ef6ad9cee8493dd884e309a))
* change api endpoint SASjsExecutor/do -> SASjsApi/stp/execute ([d93673f](https://github.com/sasjs/server/commit/d93673f2a51098c6af8abc4a793081d4591e27de))
* cors enabled for desktop mode ([2bb10c7](https://github.com/sasjs/server/commit/2bb10c71661b5de7ed515c82e5b1967b88449972))
* DB names updates + refresh api is added ([9f17b17](https://github.com/sasjs/server/commit/9f17b17e3138ce49f24447cd5ae457e3e90ad4da))
* debug not passed ([d9555e1](https://github.com/sasjs/server/commit/d9555e151b0e1d1a4068efdf8ee9ed53b25b9b89))
* **deploy:** fix payload processing ([361b539](https://github.com/sasjs/server/commit/361b539271cf95bbe570cca9e44635ab563d3f9e))
* **deps:** removed malicious dependency ([c4b9402](https://github.com/sasjs/server/commit/c4b9402f017b76dc412a17a10313f1fd5a3891ef))
* **docker:** docker-compose for prod+development ([4a363c5](https://github.com/sasjs/server/commit/4a363c5b9796283199debcc8afa810c6f561f8e6))
* **executor:** create tmp files before execution ([cdbc3fd](https://github.com/sasjs/server/commit/cdbc3fd298e2a581773448bdddcad93de3b3544d))
* **executor:** fix nosplash argument and api response ([715b1de](https://github.com/sasjs/server/commit/715b1dec68377eefe03aa8203a73debe77842436))
* fix web route ([6c7a6b6](https://github.com/sasjs/server/commit/6c7a6b6c6af28c29b391162e4e332da6524b1c61))
* **github:** fixed github flow ([8dab288](https://github.com/sasjs/server/commit/8dab28861dfa7c4c7fefc7fe038df50f58d04547))
* **github:** removed npm token ([bbb94d6](https://github.com/sasjs/server/commit/bbb94d61ce39c84a6c0c44186e89787ab0e76a8c))
* immplementation of files api fixed ([299319e](https://github.com/sasjs/server/commit/299319e2dbe06c7ca99e403fcbdec2ad1db8b7e4))
* load file when url contains filePath ([99d5577](https://github.com/sasjs/server/commit/99d55775aaac3b2caaa4b10d4ed698f6cd7fcb2a))
* modify the directory tree algorithm to include relative path with each node ([91e2e2b](https://github.com/sasjs/server/commit/91e2e2bc4a46da0d149578593559efdb87681bd4))
* norefferer issue in home page external links fix ([e2b12b7](https://github.com/sasjs/server/commit/e2b12b74f52c3ce4541fde9af6af0093b56b157b))
* on clicking  execute button open new tab for response ([02f5371](https://github.com/sasjs/server/commit/02f5371f57b311ff700ba8108f9d5168da8c22a4))
* prettier ([716ae81](https://github.com/sasjs/server/commit/716ae81d9293b42dd2a7047ac52d75401b3b8798))
* **prod-server:** use port from configuration ([4d8efbb](https://github.com/sasjs/server/commit/4d8efbb88d32154d84e80b79780e2e3de2f519e4))
* readme overview| ([b3342f0](https://github.com/sasjs/server/commit/b3342f00031d19080fb72e3460f023c5f44bac95))
* remove .sas extension from _program parameter at the end of string ([56cb2d1](https://github.com/sasjs/server/commit/56cb2d1d512beadb5cfdc4ab4034ac917311ff23))
* removing renegade dash ([4ff4d39](https://github.com/sasjs/server/commit/4ff4d39e954e895b46ddc3e2919f7f2c4e1ce01d))
* **root-package.json:** lint:fix command fixed in root package json ([ec6333f](https://github.com/sasjs/server/commit/ec6333f6aa67c1b94f54b017ed27eb3b21b4207f))
* **routes:** fix routes imports ([49c152a](https://github.com/sasjs/server/commit/49c152a398b60f6b0a0c25a68eb4c1c291984872))
* **semantic-release:** fixed package.json ([ef45787](https://github.com/sasjs/server/commit/ef45787019f1e61d0e4e2acee334236e8aca23cc))
* sending _webout as result object in response JSON ([b97523e](https://github.com/sasjs/server/commit/b97523e55584cc7d9d682cfeaab8f5b70a10b899))
* session refactoring with Saad & Allan ([cbe07b4](https://github.com/sasjs/server/commit/cbe07b4abb2e936037874af1a088cd038e0fc731))
* **ts:** enable files ([37b6936](https://github.com/sasjs/server/commit/37b6936cca3cff9c1ca26ec7b4b938a357c448df))
* update api calls from client side ([031e492](https://github.com/sasjs/server/commit/031e492d44674dec4f2b3bc1f5bf7affac5716bd))
* update api endpoints ([936a205](https://github.com/sasjs/server/commit/936a205e66073b9178089c6ab10d6ac3bf323c54))
* update sasjs drive controller from function base to class base ([3fe475d](https://github.com/sasjs/server/commit/3fe475d477c466556659b48c70eeac5153ff5b0e))
* update SASjsApi/stp/execute post api endpoints to capture url params ([d981444](https://github.com/sasjs/server/commit/d9814441bb1d269ec2404e50f51124f998c65c40))
* use hash router instead of browser router in react app ([c72867d](https://github.com/sasjs/server/commit/c72867d5a70550660c8c37220aa33693716a93f1))
* **web:** infinite call to api end point fixed ([ac745c8](https://github.com/sasjs/server/commit/ac745c8f5c3e4aa2ac8d6ca23bb1276452d4018b))
* **web:** remove unnecessary packages and files ([0fb4301](https://github.com/sasjs/server/commit/0fb43019668f5a13f6e77fdb4b3e543006b509c0))
* **weeb:** add catch block with each axios request ([552a358](https://github.com/sasjs/server/commit/552a3584ec9345bc1dec0ff5377bf773a7928d62))
* **workflow:** fix 'SASjs Server Build' ([174d94a](https://github.com/sasjs/server/commit/174d94a23c5036d61a4f2e11296283f128d4dafa))
