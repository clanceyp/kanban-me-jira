describe("Background", function() {

	describe("When Getting a local store value", function() {

		it("getting a value from a key should return the correct value fallback value", function() {

			expect( kmj.getLocalStore("i_dont_exist_no_fallback") ).toBeNull();

			expect( kmj.getLocalStore("i_dont_exist","Fallback") ).toBe('Fallback');

			expect( kmj.getLocalStore("TESTVALUE","CDE") ).toBe('ABC');

		});
		it("getting a value from a key starting with password should return plain text", function() {
			var rawPass = "MY-PASSWORD",
				pass = window.btoa( rawPass );

			expect( pass ).not.toBe( rawPass );

			expect( kmj.getLocalStore("PASSWORD_TESTING_234", pass) ).toBe( rawPass );

		});

	});
	describe("When Setting a local store value", function() {
		var rawPass = "MY-PASSWORD";
		beforeEach(function() {
			kmj.setLocalStore("PASSWORD_TESTING_1234", rawPass );
		});

		afterEach(function() {
			kmj.resetLocalStore("PASSWORD_TESTING_1234");
		});

		it("a key starting with password should not save as plain text", function() {
			expect( localStorage.getItem("PASSWORD_TESTING_1234") ).not.toBe( rawPass );
			expect( kmj.getLocalStore("PASSWORD_TESTING_1234") ).toBe( rawPass );
		});

	});
	describe("When parsing a URL ", function() {

		it("a url should not contain multiple backslashes", function() {
			expect( kmj.urlCleaner("/blah////blah//blah.html") ).toBe( '/blah/blah/blah.html' );
		});
		it("multiple backslashes should be preserved in after the protocol", function() {
			expect( kmj.urlCleaner("http://blah/////blah.html") ).toBe( 'http://blah/blah.html' );
		});
	});
	describe("When setting the browser status text ", function() {

		beforeEach(function() {
			window.chrome = {browserAction:{setBadgeText:function(item){return item.text}}};
		});

		afterEach(function() {
			window.chrome = null;
			delete window.chrome;
		});


		it("a positive number should be a string", function() {
			expect( kmj.updateBrowserActionStatus( 1 ) ).toBe( '1' ) ;
			expect( kmj.updateBrowserActionStatus( 300 ) ).not.toBe( 300 ) ;
		});
		it("a negative number or non string value should return ?", function() {
			expect( kmj.updateBrowserActionStatus( -1 ) ).toBe( '?' ) ;
			expect( kmj.updateBrowserActionStatus( null ) ).toBe( '?' ) ;
			expect( kmj.updateBrowserActionStatus( ) ).toBe( '?' ) ;
		});
		it("string should be the same", function() {
			expect( kmj.updateBrowserActionStatus( "hello" ) ).toBe( 'hello' ) ;
		});
	});

});