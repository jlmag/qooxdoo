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
     * Fabian Jakobs (fjakobs)

************************************************************************ */

qx.Class.define("demobrowser.demo.layout.ManualLayout_1",
{
  extend : qx.application.Standalone,

  members :
  {
    main: function()
    {
      this.base(arguments);

      var borderColor = "black";
      var border = new qx.ui.decoration.Single(3, "solid", borderColor);

      w1 = new qx.ui.basic.Label("Toggle border color.").set({
        backgroundColor: "red",
        decorator: border,
        paddingLeft: 10,
        paddingRight: 10
      });
      w1.setBounds(10, 10, 100, 30);

      w2 = new qx.ui.core.Widget().set({
        backgroundColor: "blue",
        decorator: border
      });
      w2.setBounds(200, 20, 150, 100);

      w3 = new qx.ui.core.Widget().set({
        backgroundColor: "green",
        decorator: border,
        padding: 3
      });
      w3.setBounds(380, 50, 150, 100);

      w4 = new qx.ui.core.Widget().set({
        backgroundColor: "yellow",
        decorator: border,
        padding: 10
      });
      w4.setBounds(50, 200, 150, 100);

      w1.addListener("click", function(e) {
        borderColor = borderColor == "black" ? "orange" : "black";
        border.setColor(borderColor);
      });


      var container = new qx.ui.container.Composite();

      container.add(w1);
      container.add(w2);
      container.add(w3);
      container.add(w4);

      this.getRoot().add(container, 0, 0, 0, 0);
    }
  }
});
