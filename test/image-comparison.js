/**
 * (C) Copyright 2017 o2r-project
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const assert = require('chai').assert;
const expect = require('chai').expect;
const debug = require('debug')('tester');
const colors = require('colors');

const PNG = require('pngjs').PNG;

var rewire = require('rewire'); // for testing unexported functions, see https://stackoverflow.com/questions/14874208/how-to-access-and-test-an-internal-non-exports-function-in-a-node-js-module
var checkerCore = rewire('../lib/checker.js');

compareImages = checkerCore.__get__('compareImages');
extractImagesOutOfHTMLStringsAndCreateBuffers = checkerCore.__get__('extractImagesOutOfHTMLStringsAndCreateBuffers');
prepareImagesForComparison = checkerCore.__get__('prepareImagesForComparison');


describe('Testing image comparison', function () {

	describe('Testing image comparison', function () {
		var paperA = 'test/TestPapers_2/paper_9_img_A.html';
		var paperB = 'test/TestPapers_2/paper_9_img_D.html';

		var images;

		try {
			fs.mkdirSync(path.join(os.tmpdir(), 'erc-checker'));
		} catch (e) { debug(e); }

		before(function (done) {
			let inputFiles = [fs.readFileSync(paperA, 'utf-8'), fs.readFileSync(paperB, 'utf-8')];

			extractImagesOutOfHTMLStringsAndCreateBuffers(inputFiles)
				.then(prepareImagesForComparison)
				.then(function (result) {

					var originalImageBuffer = result.images[1].originalImage.buffer;
					var reproducedImageBuffer = result.images[1].reproducedImage.buffer;


					images = [{
						originalImage: {
							buffer: originalImageBuffer
						},
						reproducedImage: {
							buffer: reproducedImageBuffer
						}
					}];
					done();
				});
		});

		it('should create a file matching the reference file', function (done) {
			compareImages(images)
				.then(
					function (compareResult) {
						let result = compareResult[0].diffImages;

						if (result != undefined && result.length === images.length && result[0].buffer instanceof Buffer) {

							let tmpDiffOutputPath = compareResult[1];

							let testImage = fs.readFileSync("./test/img/testDiffImg.png"),
								newDiffImage = fs.readFileSync(path.join(tmpDiffOutputPath, "diffImage0.png"));

							try {
								fs.unlinkSync(path.join(tmpDiffOutputPath, "diffImage0.png"));
								fs.rmdirSync(tmpDiffOutputPath);
							} catch (e) { debug(e); }

							let correctPathInResult = (tmpDiffOutputPath.includes('/erc-checker/diffImages_') || tmpDiffOutputPath.includes('\\erc-checker\\diffImages_'));

							if (testImage.equals(newDiffImage) && correctPathInResult) {
								done();
							}
							else {
								done(new Error("Diff Image differs from provided test image."));
							}
						}
						else {
							try {
								fs.unlinkSync(path.join(compareResult[1], "diffImage0.png"));
							}
							catch (e) { }
							done(new Error("Wrong result."))
						}
					},
					function (reason) {
						debug("Error comparing images.".yellow);
						done(new Error(reason));
					}
				);
		});
	})

});