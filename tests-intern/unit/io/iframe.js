define([
	'intern!object',
	'intern/chai!assert',
	'dojo/io/iframe',
	'dojo/_base/kernel',
	'dojo/topic',
	'intern/dojo/dom',
	'intern/dojo/dom-construct',
	'intern/dojo/domReady!'
], function (registerSuite, assert, iframe, kernel, topic, dom, domConstruct) {
	function form(method, test) {
		return {
			before: function () {
				domConstruct.place('<form id="postTest" method="' + method + '" enctype="multipart/form-data"></form>', document.body);
			},

			test: test,

			after: function () {
				domConstruct.destroy('postTest');
			}
		};
	}
	registerSuite({
		name: 'dojo/io/iframe',

		'GET': {
			'text': function () {
				var dfd = this.async(),
					fdfd = iframe.send({
						url: '/__services/request/iframe?type=text',
						method: 'GET',
						timeout: 5000,
						preventCache: true,
						handle: dfd.callback(function (res, ioArgs) {
							assert.strictEqual(res, 'iframe succeeded');
						})
					});

				fdfd.addErrback(dfd.reject);
			},

			'JSON with form': form('GET', function () {
				var dfd = this.async(),
					fdfd = iframe.send({
						url: '/__services/request/iframe',
						form: 'postTest',
						content: {
							type: 'json',
							color: 'blue',
							size: 42
						},
						timeout: 5000,
						preventCache: true,
						handleAs: 'json',
						handle: dfd.callback(function (res, ioArgs) {
							assert.strictEqual(res.query.color, 'blue');
							assert.strictEqual(res.query.size, '42');
						})
					});

				fdfd.addErrback(dfd.reject);
			}),

			'JSON': function () {
				var dfd = this.async(),
					fdfd = iframe.send({
						url: '/__services/request/iframe',
						content: {
							type: 'json',
							color: 'blue',
							size: 42
						},
						timeout: 5000,
						preventCache: true,
						handleAs: 'json',
						handle: dfd.callback(function (res, ioArgs) {
							assert.strictEqual(res.query.color, 'blue');
							assert.strictEqual(res.query.size, '42');
						})
					});

				fdfd.addErrback(dfd.reject);
			},

			'JSON without POST': function () {
				var dfd = this.async(),
					fdfd = iframe.send({
						url: '/__services/request/iframe',
						method: 'POST',
						content: {
							type: 'json',
							color: 'blue',
							size: 42
						},
						timeout: 5000,
						preventCache: true,
						handleAs: 'json',
						handle: dfd.callback(function (res, ioArgs) {
							assert.strictEqual(res.method, 'GET');
							assert.strictEqual(res.query.color, 'blue');
							assert.strictEqual(res.query.size, '42');
						})
					});

				fdfd.addErrback(dfd.reject);
			},

			'JavaScript': function () {
				var dfd = this.async(),
					fdfd = iframe.send({
						url: '/__services/request/iframe',
						content: {
							type: 'javascript'
						},
						timeout: 5000,
						preventCache: true,
						handleAs: 'javascript',
						handle: dfd.callback(function (res, ioArgs) {
							assert.strictEqual(window.iframeTestingFunction(), 42);
						})
					});

				fdfd.addErrback(dfd.reject);
			},

			'HTML': function () {
				var dfd = this.async(),
					fdfd = iframe.send({
						url: '/__services/request/iframe',
						content: {
							type: 'html'
						},
						timeout: 5000,
						preventCache: true,
						handleAs: 'html',
						handle: dfd.callback(function (res, ioArgs) {
							assert.strictEqual(res.getElementsByTagName('h1')[0].innerHTML, 'SUCCESSFUL HTML response');
						})
					});

				fdfd.addErrback(dfd.reject);
			},
			'XML': function () {
				var dfd = this.async(),
					fdfd = iframe.send({
						url: '/__services/request/iframe',
						content: {
							type: 'xml'
						},
						timeout: 5000,
						preventCache: true,
						handleAs: 'xml',
						handle: dfd.callback(function (res, ioArgs) {
							assert.strictEqual(res.documentElement.getElementsByTagName('child').length, 4);
						})
					});

				fdfd.addErrback(dfd.reject);
			},
			'content array': function () {
				var dfd = this.async(),
					fdfd = iframe.send({
						url: '/__services/request/iframe',
						content: {
							type: 'text',
							tag: [ 'value1', 'value2' ]
						},
						timeout: 5000,
						preventCache: true,
						handle: dfd.callback(function (res, ioArgs) {
							assert.notInstanceOf(res, Error);
						})
					});

				fdfd.addErrback(dfd.reject);
			}
		},

		'POST': form('POST', function () {
			var dfd = this.async(),
				fdfd = iframe.send({
					url: '/__services/request/iframe?type=json',
					method: 'post',
					form: 'postTest',
					content: {
						color: 'blue',
						size: 42
					},
					timeout: 5000,
					preventCache: true,
					handleAs: 'json',
					handle: dfd.callback(function (res, ioArgs) {
						assert.strictEqual(res.method, 'POST');
						assert.strictEqual(res.payload.color, 'blue');
						assert.strictEqual(res.payload.size, '42');
					})
				});

			fdfd.addErrback(dfd.reject);
		}),

		'ioPublish': {
			before: function () {
				kernel.config.ioPublish = true;

				this._testTopicCount = 0;
				var self = this;
				function increment() {
					self._testTopicCount++;
				}
				var handles = [
					topic.subscribe('/dojo/io/start', increment),
					topic.subscribe('/dojo/io/send', increment),
					topic.subscribe('/dojo/io/load', increment),
					topic.subscribe('/dojo/io/done', increment)
				];

				this._remover = function () {
					for (var i = 0; i < handles.length; i++) {
						handles[i].remove();
					}
				};
			},

			test: function () {
				var dfd = this.async();

				var self = this;
				var handle = topic.subscribe('/dojo/io/stop', dfd.callback(function () {
					self.parent._testTopicCount++;

					assert.strictEqual(self.parent._testTopicCount, 5);
				}));

				iframe.send({
					url: '/__services/request/iframe',
					timeout: 5000,
					preventCache: true
				});
			},

			after: function () {
				this._remover();
				kernel.config.ioPublish = false;
			}
		}
	});
});
