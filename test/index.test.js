var DisplayerAPI = require('../index');
var should = require('should');
var nock = require('nock');

describe("Displayer API Client", function () {

  before(function() {
    this.backpack = nock('http://backpack.org/');
    this.displayerApi = new DisplayerAPI('http://backpack.org/');
  });

  describe("Node callback style", function () {
    it('should get id', function (done) {
      this.backpack.post('/displayer/convert/email', {
        email: "someone@example.org"
      }).reply(200, {
        status: "okay",
        email: "someone@example.org",
        userId: 1
      });

      var u = this.displayerApi.user("someone@example.org");
      u.id(function (err, id) {
        (!err).should.be.true;
        id.should.equal(1);
        done();
      });
    });

    it('should get groups', function (done) {
      this.backpack.get('/displayer/1/groups.json').reply(200, {
        userId: 1,
        groups: [
          {
            groupId: 10,
            name: 'group name',
            badges: 5
          }
        ]
      });

      var u = this.displayerApi.user({
        email: "someone@example.org",
        id: 1
      });
      u.groups(function (err, groups) {
        (!err).should.be.true;
        groups.length.should.equal(1);
        groups[0].should.have.keys('groupId', 'name', 'badges');
        done();
      });
    });

    it('should get badges by group id', function (done) {
      this.backpack.get('/displayer/1/group/10.json').reply(200, {
        userId: 1,
        groupId: 10,
        badges: [{
          someAttr: 1, otherAttr: 2
        }]
      });

      var u = this.displayerApi.user({
        email: "someone@example.org",
        id: 1
      });
      u.group(10, function (err, badges) {
        (!err).should.be.true;
        badges.length.should.equal(1);
        badges[0].should.have.keys('someAttr', 'otherAttr');
        done();
      });
    });
  });

  describe("Success/failure callback style", function () {
    it('should get id', function (done) {
      this.backpack.post('/displayer/convert/email', {
        email: "someone@example.org"
      }).reply(200, {
        status: "okay",
        email: "someone@example.org",
        userId: 1
      });

      var u = this.displayerApi.user("someone@example.org");
      u.id(function (id) {
        id.should.equal(1);
        done();
      }, function (err) {
        throw(new Error("should not get here"));
      });
    });
  });

  describe("Promise style", function () {
    it('should get id', function (done) {
      this.backpack.post('/displayer/convert/email', {
        email: "someone@example.org"
      }).reply(200, {
        status: "okay",
        email: "someone@example.org",
        userId: 1
      });

      var u = this.displayerApi.user("someone@example.org");
      u.id().then(function (id) {
        id.should.equal(1);
        done();
      }, function (err) {
        throw(new Error("should not get here"));
      });
    });
  });

  describe("Streams", function () {
    it('should get groups stream', function (done) {
      this.backpack.get('/displayer/1/groups.json').reply(200, {
        userId: 1,
        groups: [
          {
            groupId: 10,
            name: 'group name',
            badges: 5
          }
        ]
      });

      var u = this.displayerApi.user({
        email: "someone@example.org",
        id: 1
      });
      var s = u.getGroupStream();
      s.on('data', function (data) {
        data.should.have.keys('groupId', 'name', 'badges');
      });
      s.on('root', function (root, count) {
        count.should.equal(1);
        done();
      });
    });

    it('should get badges stream', function (done) {
      this.backpack.get('/displayer/1/group/10.json').reply(200, {
        userId: 1,
        groupId: 10,
        badges: [{
          someAttr: 1, otherAttr: 2
        }]
      });

      var u = this.displayerApi.user({
        email: "someone@example.org",
        id: 1
      });
      var s = u.getBadgeStream(10);
      s.on('data', function (data) {
        data.should.have.keys('someAttr', 'otherAttr');
      });
      s.on('root', function (root, count) {
        count.should.equal(1);
        done();
      });
    });
  });

  describe('Errors', function () {
    it('should pass through error status and message', function (done) {
      this.backpack.post('/displayer/convert/email', {
        email: "someone@example.org"
      }).reply(404, {
        status: "missing",
        error: "some msg"
      });

      var u = this.displayerApi.user("someone@example.org");
      u.id(function (err, id) {
        should(id).not.be.ok;
        should(err).be.ok;
        err.message.should.equal('some msg');
        err.status.should.equal('missing');
        done();
      });
    });

    it('should handle bodyless errors', function (done) {
      this.backpack.post('/displayer/convert/email', {
        email: "someone@example.org"
      }).reply(500, "error");

      var u = this.displayerApi.user("someone@example.org");
      u.id(function (err, id) {
        should(id).not.be.ok;
        should(err).be.ok;
        err.message.should.equal('Non-200 response: 500');
        done();
      });
    });

    it('should handle stream errors', function (done) {
      this.backpack.get('/displayer/1/groups.json').reply(404, {status: "missing"});

      var u = this.displayerApi.user({
        email: "someone@example.org",
        id: 1
      });
      var s = u.getGroupStream();
      s.on('error', function (err) {
        should(err).be.ok;
        err.message.should.equal('Non-200 response: 404');
        done();
      });
    });
  });
});