/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2011 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Christian Hagendorn (chris_schmidt)

************************************************************************ */

/**
 * EXPERIMENTAL!
 *
 * Virtual tree implementation.
 */
qx.Class.define("qx.ui.tree.VirtualTree",
{
  extend : qx.ui.virtual.core.Scroller,

  /**
   * @param model {Object|null} The model structure for the tree.
   */
  construct : function(model)
  {
    this.base(arguments, 0, 1, 20, 100);

    this.__lookupTable = [];
    this._initLayer();

    if(model != null) {
      this.initModel(model);
    } else {
      this.initModel({name: "", children: []});
    }
  },


  properties :
  {
    // overridden
    appearance :
    {
      refine: true,
      init: "virtual-tree"
    },


    // overridden
    focusable :
    {
      refine: true,
      init: true
    },


    /**
     * Control whether clicks or double clicks should open or close the clicked
     * folder.
     */
    openMode :
    {
      check: ["click", "dblclick", "none"],
      init: "dblclick",
      apply: "_applyOpenMode",
      event: "changeOpenMode",
      themeable: true
    },


    /**
     * Hide the root (Tree) node.  This differs from the visibility property in
     * that this property hides *only* the root node, not the node's children.
     */
    hideRoot :
    {
      check: "Boolean",
      init: false,
      apply:"_applyHideRoot"
    },


    /**
     * Whether the Root should have an open/close button.  This may also be
     * used in conjunction with the hideNode property to provide for virtual root
     * nodes.  In the latter case, be very sure that the virtual root nodes are
     * expanded programatically, since there will be no open/close button for the
     * user to open them.
     */
    rootOpenClose :
    {
      check: "Boolean",
      init: false,
      apply: "_applyRootOpenClose"
    },


    /**
     * The model containing the data (nodes and/or leafs) which should be shown
     * in the tree.
     */
    model :
    {
      check : "Object",
      apply : "_applyModel",
      event: "changeModel",
      nullable : false,
      deferredInit : true
    }
  },


  members :
  {
    /** {Array} The internal lookup table data structure to get the model item from a row. */
    __lookupTable : null,


    /** {qx.ui.virtual.layer.Abstract} layer which contains the items. */
    _layer : null,


    // property apply
    _applyOpenMode : function(value, old) {
    },


    // property apply
    _applyHideRoot : function(value, old) {
    },


    // property apply
    _applyRootOpenClose : function(value, old) {
    },


    // property apply
    _applyModel : function(value, old) {
      this.__buildLookupTable();
    },

    
    /**
     * Initializes the virtual list.
     */
    _initLayer : function()
    {
      var provider = new qx.ui.tree.provider.WidgetProvider(this);
      this._layer = provider.createLayer();
      this.getPane().addLayer(this._layer);
    },
    

    /**
     * Helper method to build the internal data structure.
     */
    __buildLookupTable : function() {
      this.__lookupTable = [];

      var root = this.getModel();
      this.__lookupTable.push(root);

      for (var i = 0; i < root.children.length; i++) {
        this.__lookupTable.push(root.children[i]);
      }

      this.__updateRowCount();
    },


    /**
     * Returns the internal data structure. The Array index is the
     * row and the value is the model item.
     *
     * @internal
     * @return {Array} The internal data structure.
     */
    getLookupTable : function() {
      return this.__lookupTable;
    },


    /**
     * Helper method to update the row count.
     */
    __updateRowCount : function() {
      this.getPane().getRowConfig().setItemCount(this.getLookupTable().length);
    }
  },


  destruct : function() {
    this.__lookupTable = null;
  }
});