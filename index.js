var Promise = require('bluebird');
var JSONStream = require('JSONStream');
var request = require('request');
var urlUtil = require('url');
var util = require('util');

function User (emailOrObj, opts) {
  var self = this;

  if (typeof emailOrObj === 'object') {
    self._email = emailOrObj.email;
    self._id = emailOrObj.id;
  }
  else {
    self._email = emailOrObj;
  }

  self.id = function id (success, failure) {
    var p = new Promise(function (resolve, reject) {
      if (self._id) return resolve(self._id);

      var endpoint = urlUtil.resolve(opts.url, '/displayer/convert/email'); 
      request({
        url: endpoint,
        method: 'POST',
        json: {
          email: self._email
        }
      }, function (err, res, body) {
        if (err) return reject(err);
        if (res.statusCode !== 200) return reject(new Error('Non-200 response: ' + res.statusCode));
        if (body && body.status !== 'okay') return reject(new Error(body));
        self._id = body.userId;
        resolve(body.userId);
      });
    });
    
    if (success && !failure) p.nodeify(success);
    if (success && failure) p.then(success, failure);
    return p;
  };

  self.groups = function groups (success, failure) {
    var p = self.id().then(function (id) {
      return new Promise(function (resolve, reject) {
        var endpoint = urlUtil.resolve(opts.url, util.format('/displayer/%s/groups.json', id));
        request({
          url: endpoint,
          method: 'GET',
          json: true
        }, function (err, res, body) {
          if (err) return reject(err);
          if (res.statusCode !== 200) return reject(new Error('Non-200 response: ' + res.statusCode));
          resolve(body.groups);
        });
      });
    });

    if (success && !failure) p.nodeify(success);
    if (success && failure) p.then(success, failure);
    return p;
  };

  self.getGroupStream = function getGroupStream () {
    if (!this._id) throw new Error("Cannot open stream until id is known");
    var endpoint = urlUtil.resolve(opts.url, util.format('/displayer/%s/groups.json', this._id));
    var r = request({
      url: endpoint,
      method: 'GET',
      json: true
    });
    var j = JSONStream.parse('groups.*');
    return r.pipe(j);
  };

  self.group = function group (groupId, success, failure) {
    var p = self.id().then(function (id) {
      return new Promise(function (resolve, reject) {
        var endpoint = urlUtil.resolve(opts.url, util.format('/displayer/%s/group/%s.json', id, groupId));
        request({
          url: endpoint,
          method: 'GET',
          json: true
        }, function (err, res, body) {
          if (err) return reject(err);
          if (res.statusCode !== 200) return reject(new Error('Non-200 response: ' + res.statusCode));
          resolve(body.badges);
        });
      });
    });

    if (success && !failure) p.nodeify(success);
    if (success && failure) p.then(success, failure);
    return p;
  };

  self.getBadgeStream = function (groupId) {
    if (!this._id) throw new Error("Cannot open stream until id is known");
    var endpoint = urlUtil.resolve(opts.url, util.format('/displayer/%s/group/%s.json', this._id, groupId));
    var r = request({
      url: endpoint,
      method: 'GET',
      json: true
    });
    var j = JSONStream.parse('badges.*');
    return r.pipe(j);
  };

  return self;
}

module.exports = function DisplayerAPI (opts) {
  opts = opts || {};
  if (typeof opts === 'string') {
    var url = opts;
    opts = {
      url: url
    };
  }

  this.user = function user (emailOrObj) {
    return new User(emailOrObj, {
      url: opts.url
    });
  };
};