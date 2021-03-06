/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2008 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Sebastian Werner (wpbasti)
     * Andreas Ecker (ecker)
     * Fabian Jakobs (fjakobs)

************************************************************************ */

/**
 * Manager for decoration themes
 */
qx.Class.define("qx.theme.manager.Decoration",
{
  type : "singleton",
  extend : qx.core.Object,



  construct : function() {
    this.base(arguments);
    this.__rules = [];
  },


  /*
  *****************************************************************************
     PROPERTIES
  *****************************************************************************
  */

  properties :
  {
    /** Selected decoration theme */
    theme :
    {
      check : "Theme",
      nullable : true,
      apply : "_applyTheme",
      event : "changeTheme"
    }
  },




  /*
  *****************************************************************************
     MEMBERS
  *****************************************************************************
  */

  members :
  {
    __dynamic : null,
    __rules : null,


    /**
     * Returns the name which will be / is used as css class name.
     * @param value {Decorator} The decorator string or instance.
     * @return {String} The css class name.
     */
    getCssClassName : function(value) {
      if (qx.lang.Type.isString(value)) {
        return "qx-" + value;
      } else {
        return "qx-" + value.toHashCode();
      }
    },


    /**
     * Adds a css class to the global stylesheet for the given decorator.
     * This includes resolving the decorator if it's a string.
     * @param value {Decorator} The decorator string or instance.
     * @return {String} the css class name.
     */
    addCssClass : function(value) {
      var sheet = qx.ui.style.Stylesheet.getInstance();

      var instance;
      if (qx.lang.Type.isString(value)) {
        instance = this.resolve(value);
      } else {
        instance = value;
      }

      value = this.getCssClassName(value);
      var selector = "." + value;

      if (sheet.hasRule(selector)) {
        return value;
      }

      // create and add a CSS rule
      var css = "";
      var styles = instance.getStyles(true);
      for (var key in styles) {

        // if we find a map value, use it as pseudo class
        if (qx.Bootstrap.isObject(styles[key])) {
          var innerCss = "";
          var innerStyles = styles[key];
          for (var innerKey in innerStyles) {
            innerCss += innerKey + ":" + innerStyles[innerKey] + ";";
          }
          this.__rules.push(selector + key);
          sheet.addRule(selector + key, innerCss);
          continue;
        }
        css += key + ":" + styles[key] + ";";
      }

      if (css) {
        sheet.addRule(selector, css);
        this.__rules.push(selector);
      }

      return value;
    },


    /**
     * Returns the dynamically interpreted result for the incoming value
     *
     * @param value {String} dynamically interpreted idenfier
     * @return {var} return the (translated) result of the incoming value
     */
    resolve : function(value)
    {
      if (!value) {
        return null;
      }

      if (typeof value === "object") {
        return value;
      }

      var theme = this.getTheme();
      if (!theme) {
        return null;
      }

      var cache = this.__dynamic;
      if (!cache) {
        cache = this.__dynamic = {};
      }

      var resolved = cache[value];
      if (resolved) {
        return resolved;
      }

      var entry = qx.lang.Object.clone(theme.decorations[value], true);
      if (!entry) {
        return null;
      }

      // create empty style map if necessary
      if (!entry.style) {
        entry.style = {};
      }

      // check for inheritance
      var currentEntry = entry;
      while (currentEntry.include) {
        currentEntry = theme.decorations[currentEntry.include];
        // decoration key
        if (!entry.decorator && currentEntry.decorator) {
          entry.decorator = qx.lang.Object.clone(currentEntry.decorator);
        }

        // styles key
        if (currentEntry.style) {
          for (var key in currentEntry.style) {
            if (entry.style[key] == undefined) {
              entry.style[key] = qx.lang.Object.clone(currentEntry.style[key], true);
            }
          }
        }
      }

      return cache[value] = (new qx.ui.decoration.Decorator()).set(entry.style);
    },


    /**
     * Whether the given value is valid for being used in a property
     * with the 'check' configured to 'Decorator'.
     *
     * @param value {var} Incoming value
     * @return {Boolean} Whether the value is valid for being used in a Decorator property
     */
    isValidPropertyValue : function(value)
    {
      if (typeof value === "string") {
        return this.isDynamic(value);
      }
      else if (typeof value === "object")
      {
        var clazz = value.constructor;
        return qx.Class.hasInterface(clazz, qx.ui.decoration.IDecorator);
      }

      return false;
    },


    /**
     * Whether a value is interpreted dynamically
     *
     * @param value {String} dynamically interpreted identifier
     * @return {Boolean} returns <code>true</code> if the value is interpreted dynamically
     */
    isDynamic : function(value)
    {
      if (!value) {
        return false;
      }

      var theme = this.getTheme();
      if (!theme) {
        return false;
      }

      return !!theme.decorations[value];
    },


    /**
     * Whether the given decorator is cached
     *
     * @param decorator {qx.ui.decoration.IDecorator} The decorator to check
     * @return {Boolean} <code>true</code> if the decorator is cached
     * @internal
     */
    isCached : function(decorator)
    {
      return !this.__dynamic ? false :
        qx.lang.Object.contains(this.__dynamic, decorator);
    },


    // property apply
    _applyTheme : function(value, old)
    {
      var aliasManager = qx.util.AliasManager.getInstance();

      // remove old rules
      for (var i=0; i < this.__rules.length; i++) {
        var selector = this.__rules[i];
        qx.ui.style.Stylesheet.getInstance().removeRule(selector);
      };
      this.__rules = [];

      if (old)
      {
        for (var alias in old.aliases) {
          aliasManager.remove(alias);
        }
      }

      if (value)
      {
        for (var alias in value.aliases) {
          aliasManager.add(alias, value.aliases[alias]);
        }
      }

      this._disposeMap("__dynamic");
      this.__dynamic = {};
    }
  },



  /*
  *****************************************************************************
     DESTRUCTOR
  *****************************************************************************
  */

  destruct : function() {
    this._disposeMap("__dynamic");
  }
});
