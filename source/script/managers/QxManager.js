function QxManager()
{
  QxTarget.call(this);

  this._objects = {};
};

QxManager.extend(QxTarget, "QxManager");

proto.add = function(oObject)
{
  var h = oObject.toHash();
  
  if (this._objects[h])
  {
    this.debug("Already known: " + oObject);
    return false;
  };
    
  this._objects[h] = oObject;
  return true;
};

proto.remove = function(oObject)
{
  delete this._objects[oObject.toHash()];
  return true;
};

proto.has = function(oObject)
{
  return this._objects[oObject.toHash()] != null;
};

proto.get = function(oObject)
{
  return this._objects[oObject.toHash()];
};

proto.dispose = function()
{
  if(this.getDisposed()) {
    return;
  };

  if (typeof this._objects != "undefined")
  {
    for (var i in this._objects)
    {
      if (typeof this._objects[i] == "object")
        this._objects[i].dispose();

      delete this._objects[i];
    };

    delete this._objects;
  };

  QxTarget.prototype.dispose.call(this);
};