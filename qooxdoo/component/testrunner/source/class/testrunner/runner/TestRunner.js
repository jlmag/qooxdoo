/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2007-2008 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Thomas Herchenroeder (thron7)
     * Fabian Jakobs (fjakobs)
     * Jonathan Rass (jonathan_rass)

************************************************************************ */

/* ************************************************************************
#asset(qx/icon/${qx.icontheme}/16/apps/video-player.png)
#asset(qx/icon/${qx.icontheme}/16/apps/photo-album.png)
#asset(qx/icon/${qx.icontheme}/16/actions/view-refresh.png)
#asset(qx/icon/${qx.icontheme}/16/actions/media-playback-start.png)
#asset(qx/icon/${qx.icontheme}/16/apps/network-manager.png)
#asset(qx/icon/${qx.icontheme}/16/apps/preferences-display.png)

************************************************************************ */

/**
 * The GUI definition of the qooxdoo unit test runner.
 */
qx.Class.define("testrunner.runner.TestRunner",
{
  extend : qx.ui.container.Composite,

  /*
  *****************************************************************************
     CONSTRUCTOR
  *****************************************************************************
  */

  construct : function()
  {
    this.base(arguments);

    this.setLayout(new qx.ui.layout.VBox);

    // Dependencies to loggers
    qx.log.appender.Native;
    qx.log.appender.Console;

    this.widgets = {};
    this.tests = {};

    // Toolbar
    this.toolbar = this.__makeToolbar();
    this.add(this.toolbar);

    // Main Pane
    // split
    var mainsplit = new qx.ui.splitpane.Pane("horizontal");
    mainsplit.setPadding(5, 5, 0, 5);
    this.add(mainsplit, {flex : 1});
    this.mainsplit = mainsplit;

    var deco = new qx.ui.decoration.Single().set({
      backgroundImage  : "decoration/table/header-cell.png",
      backgroundRepeat : "scale",
      widthBottom : 1,
      colorBottom : "border-dark",
      style       : "solid"
    });
    
    this._labelDeco = deco;

    // Left -- is done when iframe is loaded
    var left = this.__makeLeft();
    left.setWidth(250);
    this.left = left;
    this.mainsplit.add(left, 0);


    // Right
    var right = new qx.ui.container.Composite(new qx.ui.layout.VBox);
    mainsplit.add(right, 1);

    // progress bar
    this._progress = this.__makeProgress();

    // output views
    var buttview = this.__makeOutputViews();
    right.add(buttview, {flex : 1});

    // Log Appender
    this.debug("This should go to the dedicated log window ...");

    // Last but not least:
    // Hidden IFrame for test runs (will be added to statusbar)
    var iframe = new qx.ui.embed.Iframe;
    iframe.setSource(null)
    this.iframe = iframe;

    iframe.set({
      width  : 0,
      height : 0,
      zIndex : 5
    });

    // status
    var statuspane = this.__makeStatus();
    this.widgets["statuspane"] = statuspane;
    this.add(statuspane);


    // Get the TestLoader from the Iframe (in the event handler)
    iframe.addListener("load", this._ehIframeOnLoad, this);
  },



  /*
  *****************************************************************************
     PROPERTIES
  *****************************************************************************
  */

  properties :
  {
    succCnt :
    {
      check : "Integer",
      init  : 0,
      apply : "_applySuccCnt"
    },

    failCnt :
    {
      check : "Integer",
      init  : 0,
      apply : "_applyFailCnt"
    },

    queCnt :
    {
      check : "Integer",
      init  : 0,
      apply : "_applyQueCnt"
    }
  },




  /*
  *****************************************************************************
     MEMBERS
  *****************************************************************************
  */

  members :
  {
    /** This one is called by Application.js
     */
    load : function() {
      this.iframe.setSource(this.__testSuiteUrl);
    },


    // ------------------------------------------------------------------------
    //   CONSTRUCTOR HELPERS
    // ------------------------------------------------------------------------

    /**
     * TODOC
     *
     * @return {var} TODOC
     */
    __makeToolbar : function()
    {
      var toolbar = new qx.ui.toolbar.ToolBar;

      // -- run button
      this.runbutton = new qx.ui.toolbar.Button(null, "icon/16/actions/media-playback-start.png");
      toolbar.add(this.runbutton);
      this.widgets["toolbar.runbutton"] = this.runbutton;
      this.runbutton.addListener("execute", this.runTest, this);
      this.runbutton.setToolTip(new qx.ui.tooltip.ToolTip("Run selected test(s)"));

      toolbar.add(new qx.ui.toolbar.Separator);

      var testUri   = qx.core.Setting.get("qx.testPageUri");
      var nameSpace = qx.core.Setting.get("qx.testNameSpace");
      this.__testSuiteUrl = testUri+"?testclass="+nameSpace;
      this.testSuiteUrl = new qx.ui.form.TextField(this.__testSuiteUrl);
      toolbar.add(this.testSuiteUrl);
      this.testSuiteUrl.setToolTip(new qx.ui.tooltip.ToolTip("Test backend application URL"));

      this.testSuiteUrl.set(
      {
        width       : 300,
        marginRight : 5,
        marginTop : 2,
        marginBottom : 2,
        alignY : "middle"
      });

      this.testSuiteUrl.addListener("keydown", function(e)
      {
        if (e.getKeyIdentifier() == "Enter") {
          this.reloadTestSuite();
        }
      },
      this);

      // -- reload button
      this.reloadbutton = new qx.ui.toolbar.Button(null, "icon/16/actions/view-refresh.png");
      toolbar.add(this.reloadbutton);
      this.reloadbutton.setToolTip(new qx.ui.tooltip.ToolTip("Reload test backend application"));
      this.reloadbutton.addListener("execute", this.reloadTestSuite, this);

      toolbar.addSpacer();

      // -- reload switch
      var part = new qx.ui.toolbar.Part();
      //part.setVerticalChildrenAlign("middle");
      toolbar.add(part);
      this.reloadswitch = new qx.ui.toolbar.CheckBox("Reload before Test", "testrunner/image/yellow_diamond_hollow18.gif");
      part.add(this.reloadswitch);
      this.reloadswitch.setShow("both");
      this.reloadswitch.setToolTip(new qx.ui.tooltip.ToolTip("Always reload test backend before testing"));

      this.reloadswitch.addListener("changeChecked", function(e)
      {
        if (this.reloadswitch.getChecked()) {
          this.reloadswitch.setIcon("testrunner/image/yellow_diamond_full18.gif");
        } else {
          this.reloadswitch.setIcon("testrunner/image/yellow_diamond_hollow18.gif");
        }
      },
      this);

      return toolbar;
    },  // makeToolbar


    /**
     * TODOC
     *
     * @return {var} TODOC
     */
    __makeOutputViews : function()
    {
      // Main Container
      var pane = new qx.ui.splitpane.Pane("horizontal");
      this.widgets["tabview"] = pane;
      var p1 = new qx.ui.container.Composite(new qx.ui.layout.VBox(10)).set({
        width : 400,
        decorator : "black"
      });
      
      var p2 = new qx.ui.container.Composite(new qx.ui.layout.VBox()).set({
        decorator : "black"
      });

      var caption1 = new qx.ui.basic.Label("Test Results").set({
        font : "bold",
        decorator : this._labelDeco,
        padding : [4, 3],
        allowGrowX : true,
        allowGrowY : true
      });
      
      var caption2 = new qx.ui.basic.Label("Log").set({
        font : "bold",
        decorator : this._labelDeco,
        padding : [4, 3],
        allowGrowX : true,
        allowGrowY : true
      });

      pane.add(p1, 0);
      pane.add(p2, 1);
      
      p1.add(caption1);
      p2.add(caption2);

      // First Page
      var f1 = new testrunner.runner.TestResultView();

      this.f1 = f1;
      p1.add(this._progress);
      p1.add(f1, {flex : 1});

      // Second Page
      var pp2 = new qx.ui.container.Composite(new qx.ui.layout.VBox(20));
      p2.add(pp2, {flex : 1});

      // toolbar
      /*
      var ff1_b1 = new qx.ui.form.Button("Clear");
      ff1_b1.set({
        allowGrowX : false,
        alignX : "right"
      });
      ff1_b1.addListener("execute", function(e) {
        this.logelem.innerHTML = "";
      }, this);

      pp2.add(ff1_b1);
      */

      // main output area
      this.f2 = new qx.ui.embed.Html('');
      this.f2.set({
        backgroundColor : "white",
        overflowY : "scroll"
      });
      pp2.add(this.f2, {flex:1});
      this.f2.getContentElement().setAttribute("id", "sessionlog");

      // log appender
      this.logappender = new qx.log.appender.Element();
      qx.log.Logger.unregister(this.logappender);

      // Directly create DOM element to use
      this.logelem = document.createElement("DIV");
      this.logappender.setElement(this.logelem);

      this.f2.addListenerOnce("appear", function(){
        this.f2.getContentElement().getDomElement().appendChild(this.logelem);
      }, this);

      return pane;
    },  // makeOutputViews

    // -------------------------------------------------------------------------
    /**
     * Tree View in Left Pane
     * - only make root node; rest will befilled when iframe has loaded (with
     *   leftReloadTree)
     *
     * @return {var} TODOC
     */
    __makeLeft : function()
    {
      var container = new qx.ui.container.Composite(new qx.ui.layout.VBox).set({
        decorator : "black"
      });

      var caption = new qx.ui.basic.Label("Tests").set({
        font : "bold",
        decorator : this._labelDeco,
        padding : [4, 3],
        allowGrowX : true,
        allowGrowY : true
      });
      container.add(caption)

      var tree = new qx.ui.tree.Tree("Tests");
      tree.set({
        decorator : null,
        selectionMode : "single"
      });
      this.tree = tree;
      this.widgets["treeview.full"] = tree;

      tree.addListener("changeSelection", this.treeGetSelection, this);

      // fake unique tree for selection (better to have a selection on the model)
      this.tree = {};
      var that = this;

      this.tree.getSelectedElement = function() {
        return elem = that.widgets["treeview.full"].getSelectedItem();
      };

      container.add(tree, {flex : 1});
      return container;
    },  // makeLeft

    // -------------------------------------------------------------------------
    /**
     * TODOC
     *
     * @return {var} TODOC
     */
    __makeProgress : function()
    {
      var layout = new qx.ui.layout.VBox();
      var progress = new qx.ui.container.Composite(layout);
      progress.setMarginLeft(10)
      var labelBox = new qx.ui.container.Composite(new qx.ui.layout.HBox(10));
      labelBox.setPadding(2);
      labelBox.setMarginTop(2)

      var progressb = new testrunner.runner.ProgressBar();
      progress.add(progressb);
      progress.add(labelBox);

      progressb.set({
        barColor       : "#ffffff",
        marginBottom   : 8
      });

      this.widgets["progresspane"] = progress;
      this.widgets["progresspane.progressbar"] = progressb;

      labelBox.add(new qx.ui.basic.Label("Queued: ").set({
        alignY : "middle"
      }));
      var queuecnt = new qx.ui.form.TextField("0").set({
        width : 30,
        font : "small",
        readOnly : true,
        textAlign : "right"
      });
      labelBox.add(queuecnt);
      
      
      
      labelBox.add(new qx.ui.basic.Label("Failed: ").set({
        alignY : "middle"
      }));
      var failcnt = new qx.ui.form.TextField("0").set({
        width : 30,
        font : "small",
        readOnly : true,
        textAlign : "right"
      });
      labelBox.add(failcnt);

      labelBox.add(new qx.ui.basic.Label("Succeeded: ").set({
        alignY : "middle"
      }));
      var succcnt = new qx.ui.form.TextField("0").set({
        width : 30,
        font : "small",
        readOnly : true,
        textAlign : "right"
      });

      labelBox.add(succcnt);
      this.widgets["progresspane.succ_cnt"] = succcnt;
      this.widgets["progresspane.fail_cnt"] = failcnt;
      this.widgets["progresspane.queue_cnt"] = queuecnt;

      return progress;
    },  // makeProgress

    // -------------------------------------------------------------------------
    /**
     * TODOC
     *
     * @return {var} TODOC
     */
    __makeStatus : function()
    {
      var layout = new qx.ui.layout.HBox(10);
      var statuspane = new qx.ui.container.Composite(layout);
      statuspane.setPadding(2, 2, 2, 7);
      statuspane.setMarginTop(2)

      // Test Info
      statuspane.add(new qx.ui.basic.Label("Selected Test: ").set({
        alignY : "middle"
      }));
      var l1 = new qx.ui.form.TextField("").set({
        width : 150,
        font : "small",
        readOnly : true
      });
      statuspane.add(l1);
      
      
      this.widgets["statuspane.current"] = l1;
      statuspane.add(new qx.ui.basic.Label("Number of Tests: ").set({
        alignY : "middle"
      }));
      var l2 = new qx.ui.form.TextField("").set({
        width : 30,
        font : "small",
        readOnly : true,
        textAlign : "right"
      });

      statuspane.add(l2);
      this.widgets["statuspane.number"] = l2;

      // System Info
      statuspane.add(new qx.ui.basic.Label("System Status: ").set({
        alignY : "middle"
      }));
      var l3 = new qx.ui.basic.Label("").set({
        alignY : "middle"
      });
      statuspane.add(l3);
      l3.set({ width : 150 });
      this.widgets["statuspane.systeminfo"] = l3;
      this.widgets["statuspane.systeminfo"].setContent("Loading...");


      statuspane.add(this.iframe);
      this.iframe.setDecorator(null)

      
      return statuspane;
    },  // makeStatus

    // ------------------------------------------------------------------------
    //   EVENT HANDLER
    // ------------------------------------------------------------------------
    /**
     * TODOC
     *
     * @param e {Event} TODOC
     * @return {void}
     */
    treeGetSelection : function(e)
    {

      var treeNode = this.tree.getSelectedElement();
      var modelNode = treeNode.getUserData("modelLink");
      this.tests.selected = this.tests.handler.getFullName(modelNode);

      // update status pane
      this.widgets["statuspane.current"].setValue(this.tests.selected);
      this.tests.selected_cnt = this.tests.handler.testCount(modelNode);
      this.widgets["statuspane.number"].setValue(this.tests.selected_cnt + "");

      // update toolbar
      this.widgets["toolbar.runbutton"].resetEnabled();

      // update selection in other tree
      // -- not working!

      this.widgets["statuspane.systeminfo"].setContent("Tests selected");
    },  // treeGetSelection

    // -------------------------------------------------------------------------
    /**
     * TODOC
     *
     * @param e {Event} TODOC
     * @return {void}
     */
    leftReloadTree : function(e)
    {  // use tree struct

      /**
       * create widget tree from model
       *
       * @param widgetR {qx.ui.tree.TreeFolder}    [In/Out]
       *        widget root under which the widget tree will be built
       * @param modelR  {testrunner.runner.Tree} [In]
       *        model root for the tree from which the widgets representation
       *        will be built
       */
      function buildSubTree(widgetR, modelR)
      {
        var children = modelR.getChildren();
        var t;
        var ico;

        var children = qx.lang.Array.copy(children);

        for (var i=0; i<children.length; i++)
        {
          var currNode = children[i];
          var firstChar = currNode.label.charAt(0);

          if (firstChar.toUpperCase() === firstChar) {
            currNode.__type = 2;
          } else if (currNode.hasChildren()) {
            currNode.__type = 4;
          } else {
            currNode.__type = 1;
          }
        }

        children.sort(function(a, b)
        {
          if (a.__type != b.__type) {
            return b.__type - a.__type;
          }

          return a.label > b.label ? 1 : -1;
        });

        for (var i=0; i<children.length; i++)
        {
          var currNode = children[i];

          var firstChar = currNode.label.charAt(0);

          if (currNode.__type === 2)
          {
            ico = "testrunner/image/class18.gif";
          }
          else if (currNode.__type === 4)
          {
            ico = "testrunner/image/package18.gif";
          }
          else
          {
            ico = "testrunner/image/method_public18.gif";
          }

          if (currNode.hasChildren())
          {
            t = new qx.ui.tree.TreeFolder(currNode.label, ico);
            buildSubTree(t, currNode);
          }
          else
          {
            t = new qx.ui.tree.TreeFile(currNode.label, ico);
          }

          // make connections
          widgetR.add(t);
          t.setUserData("modelLink", currNode);
          currNode.widgetLinkFull = t;

          if (that.tests.handler.getFullName(currNode) == that.tests.selected) {
            selectedElement = currNode;
          }
        }
      }
        // buildSubTree;

      function buildSubTreeFlat(widgetR, modelR)
      {
        var iter = modelR.getIterator("depth");
        var currNode;

        while (currNode = iter())
        {
          if (currNode.type && currNode.type == "test")
          {
            ;
          } else  // it's a container
          {
            if (handler.hasTests(currNode))
            {
              var fullName = handler.getFullName(currNode);
              var t = new qx.ui.tree.TreeFolder(fullName, "testrunner/image/class18.gif");
              widgetR.add(t);
              t.setUserData("modelLink", currNode);
              currNode.widgetLinkFlat = t;

              if (that.tests.handler.getFullName(currNode) == that.tests.selected) {
                selectedElement = currNode;
              }

              var children = currNode.getChildren();

              for (var i=0; i<children.length; i++)
              {
                if (children[i].type && children[i].type == "test")
                {
                  var c = new qx.ui.tree.TreeFile(children[i].label, "testrunner/image/method_public18.gif");
                  t.add(c);
                  c.setUserData("modelLink", children[i]);
                  children[i].widgetLinkFlat = c;

                  if (that.tests.handler.getFullName(children[i]) == that.tests.selected) {
                    selectedElement = children[i];
                  }
                }
              }
            }
          }
        }
      }
        // buildSubTreeFlat

      // -- Main --------------------------------
      var ttree = this.tests.handler.ttree;
      var handler = this.tests.handler;
      var that = this;

      // Reset Status Pane Elements
      this.widgets["statuspane.current"].setValue("");
      this.widgets["statuspane.number"].setValue("");

      var fulltree = this.widgets["treeview.full"];

      fulltree.setUserData("modelLink", ttree);

      // link top level model to widgets
      ttree.widgetLinkFull = fulltree;

      var selectedElement = null;  // if selection exists will be set by

      var root1 = new qx.ui.tree.TreeFolder("root1");
      root1.setOpen(true);
      fulltree.setRoot(root1);
      fulltree.setHideRoot(true);

      buildSubTree(this.widgets["treeview.full"].getRoot(), ttree);

      if (selectedElement)  // try to re-select previously selected element
      {
        var element = selectedElement.widgetLinkFull.getParent();

        while(element != null)
        {
          element.setOpen(true);
          element = element.getParent();
        }

        // Finally select the element
        selectedElement.widgetLinkFull.getTree().select(selectedElement.widgetLinkFull);
      }

    },  // leftReloadTree

    // -------------------------------------------------------------------------
    /**
     * event handler for the Run Test button - performs the tests
     *
     * @param e {Event} TODOC
     * @return {void}
     */
    runTest : function(e)
    {
      // -- Vars and Setup -----------------------
      this.toolbar.setEnabled(false);

      this.logelem.innerHTML = "";
      if (this.__state === 0)
      {
        this.setQueCnt(this.tests.selected_cnt);
        this.__state = 1;
      }

      // this.tree.setEnabled(false);
      this.widgets["statuspane.systeminfo"].setContent("Preparing...");

      this.resetGui();
      var bar = this.widgets["progresspane.progressbar"];

      // Make initial entry in output windows (test result, log, ...)
      this.appender("Now running: " + this.tests.selected);

      var tstCnt = this.tests.selected_cnt;
      var tstCurr = 1;
      var testResult;

      // start test
      // Currently, a flat list of individual tests is computed (buildList), and
      // then processed by a recursive Timer.once-controlled funtion (runtest);
      // each test is passed to the same iframe object to be run(loader.runTests).
      var that = this;
      var tlist = [];
      var tlist1 = [];
      var handler = this.tests.handler;

      // -- Helper Functions ---------------------
      // create testResult obj
      function init_testResult()
      {
        var testResult = new that.frameWindow.testrunner.TestResult();

        // set up event listeners
        testResult.addListener("startTest", function(e)
        {
          var test = e.getData();
          that.currentTestData = new testrunner.runner.TestResultData(test.getFullName());
          that.f1.addTestResult(that.currentTestData);
          that.appender("Test '" + test.getFullName() + "' started.");
        },
        that);

        testResult.addListener("failure", function(e)
        {
          var ex = e.getData().exception;
          var test = e.getData().test;
          that.currentTestData.setException(ex);
          that.currentTestData.setState("failure");
          bar.setBarColor("#9d1111");
          var val = that.getFailCnt();
          that.setFailCnt(++val);
          that.setQueCnt(that.getQueCnt() - 1);
          that.appender("Test '" + test.getFullName() + "' failed: " + ex.getMessage() + " - " + ex.getComment());
          that.widgets["progresspane.progressbar"].update(String(tstCurr + "/" + tstCnt));
          tstCurr++;
        },
        that);

        testResult.addListener("error", function(e)
        {
          var ex = e.getData().exception;
          that.currentTestData.setException(ex);
          that.currentTestData.setState("error");
          bar.setBarColor("#9d1111");
          var val = that.getFailCnt();
          that.setFailCnt(++val);
          that.setQueCnt(that.getQueCnt() - 1);
          that.appender("The test '" + e.getData().test.getFullName() + "' had an error: " + ex, ex);
          that.widgets["progresspane.progressbar"].update(String(tstCurr + "/" + tstCnt));
          tstCurr++;
        },
        that);

        testResult.addListener("endTest", function(e)
        {
          var state = that.currentTestData.getState();

          this.__fetchLog();
          
          if (state == "start")
          {
            that.currentTestData.setState("success");

            var val = that.getSuccCnt();
            that.setSuccCnt(++val);
            that.setQueCnt(that.getQueCnt() - 1);
            that.widgets["progresspane.progressbar"].update(String(tstCurr + "/" + tstCnt));
            tstCurr++;
          }
        },
        that);

        return testResult;
      }
        // init_testResult

      /*
       * function to process a list of individual tests
       * because of Timer.once restrictions, using an external var as parameter
       * (tlist)
       */

      function runtest()
      {
        that.widgets["statuspane.systeminfo"].setContent("Running tests...");
        that.toolbar.setEnabled(false);  // if we are run as run_pending

        if (tlist.length)
        {
          var test = tlist[0];
          that.loader.runTests(testResult, test[0], test[1]);
          tlist = tlist.slice(1, tlist.length);  // recurse with rest of list
          qx.event.Timer.once(runtest, this, 100);
        }
        else
        {  // no more tests -> re-enable toolbar
          that.toolbar.setEnabled(true);
          this.__state == 0;
          if (that.tests.firstrun)
          {
            that.reloadswitch.setChecked(true);
            that.tests.firstrun = false;
            that.widgets["statuspane.systeminfo"].setContent("Enabled auto-reload");
          }
          else
          {
            that.widgets["statuspane.systeminfo"].setContent("Ready");
          }
        }
      }


      /**
       * build up a list that will be used by runtest() as input (var tlist)
      */
      function buildList(node)  // node is a modelNode
      {
        var tlist = [];
        var path = handler.getPath(node);
        var tclass = path.join(".");

        if (node.hasChildren())
        {
          var children = node.getChildren();

          for (var i=0; i<children.length; i++)
          {
            if (children[i].hasChildren()) {
              tlist = tlist.concat(buildList(children[i]));
            } else {
              tlist.push([ tclass, children[i].label ]);
            }
          }
        }
        else
        {
          tlist.push([ tclass, node.label ]);
        }

        return tlist;
      }
        // buildList

      // -- Main ---------------------------------
      // get model node from selected tree node
      var widgetNode = this.tree.getSelectedElement();

      if (widgetNode) {
        var modelNode = widgetNode.getUserData("modelLink");
      }
      else
      {  // no selected tree node - this should never happen here!
        alert("Please select a test node from the tree!");
        that.toolbar.setEnabled(true);
        return;
      }

      // build list of individual tests to perform
      var tlist = buildList(modelNode);

      if (this.reloadswitch.getChecked())
      {
        // set up pending tests
        this.tests.run_pending = function()
        {
          testResult = init_testResult();

          if (!testResult) {
            that.debug("Alarm: no testResult!");
          } else {
            runtest();
          }
        };

        this.setQueCnt(this.tests.selected_cnt);
        this.reloadTestSuite();
      }
      else
      {
        // run the tests now
        testResult = init_testResult();
        runtest();
      }
    },  // runTest

    // -------------------------------------------------------------------------
    /**
     * reloads iframe's URL
     *
     * @param e {Event} TODOC
     * @return {void}
     */
    reloadTestSuite : function(e)
    {
      var curr = this.iframe.getSource();
      var neu = this.testSuiteUrl.getValue();
      this.toolbar.setEnabled(false);
      this.widgets["statuspane.systeminfo"].setContent("Reloading test suite...");

      // reset status information
      this.resetGui();

      qx.event.Timer.once(function()
      {
        if (curr == neu) {
          this.iframe.reload();
        } else {
          this.iframe.setSource(neu);
        }
      },
      this, 0);
    },  // reloadTestSuite


    /**
     * TODOC
     *
     * @param e {Event} TODOC
     * @return {void}
     */
    _ehIframeOnLoad : function(e)
    {
      var iframe = this.iframe;

      this.frameWindow = iframe.getWindow();

      // Repeat until testrunner in iframe is loaded
      if (!this.frameWindow.testrunner)
      {
        qx.event.Timer.once(this._ehIframeOnLoad, this, 100);
        return;
      }

      this.loader = this.frameWindow.testrunner.TestLoader.getInstance();
      // Avoid errors in slow browsers
      
      if(
        qx.bom.client.Engine.GECKO &&
        (qx.bom.client.Engine.VERSION < 1.9) &&
        (!this.loader)
      ){
        return;
      }

      var testRep = this.loader.getTestDescriptions();
      this.tests.handler = new testrunner.runner.TestHandler(testRep);
      this.tests.firstrun = true;
      this.leftReloadTree();
      this.toolbar.setEnabled(true);  // in case it was disabled (for reload)
      this.reloadswitch.setChecked(false);  // disable for first run

      if (this.tests.run_pending)
      {  // do we have pending tests to run?
        this.tests.run_pending();
        delete this.tests.run_pending;
      }

      this.widgets["statuspane.systeminfo"].setContent("Ready");
    },  // _ehIframeOnLoad

    // ------------------------------------------------------------------------
    //   MISC HELPERS
    // ------------------------------------------------------------------------
    /**
     * TODOC
     *
     * @return {void}
     */
    resetGui : function()
    {
      this.resetProgress();
      this.resetTabView();
    },


    /**
     * TODOC
     *
     * @return {void}
     */
    resetProgress : function()
    {
      var bar = this.widgets["progresspane.progressbar"];
      bar.reset();
      bar.setBarColor("#36a618");
      this.setSuccCnt(0);
      this.setFailCnt(0);
    },


    /**
     * TODOC
     *
     * @return {void}
     */
    resetTabView : function() {
      this.f1.clear();
    },


    /**
     * TODOC
     *
     * @param newSucc {var} TODOC
     * @return {void}
     */
    _applySuccCnt : function(newSucc) {
      this.widgets["progresspane.succ_cnt"].setValue(newSucc + "");
    },


    /**
     * TODOC
     *
     * @param newFail {var} TODOC
     * @return {void}
     */
    _applyFailCnt : function(newFail) {
      this.widgets["progresspane.fail_cnt"].setValue(newFail + "");
    },

    // property apply
    _applyQueCnt : function(value, old){
      this.widgets["progresspane.queue_cnt"].setValue(value + "");
    },

    /**
     * TODOC
     *
     * @param str {String} TODOC
     * @return {void}
     */
    appender : function(str) {

    },
    
    __fetchLog : function()
    {
      var w = this.iframe.getWindow();

      var logger;
      if (w.qx && w.qx.log && w.qx.log.Logger)
      {
        logger = w.qx.log.Logger;

        // Register to flush the log queue into the appender.
        logger.register(this.logappender)
  
        // Clear buffer
        logger.clear();
  
        // Unregister again, so that the logger can flush again the next time the tab is clicked.
        logger.unregister(this.logappender);
      }
    },

    __state : 0
  },


  destruct : function ()
  {
    this._disposeFields(
      "widgets",
      "tests",
      "tree",
      "frameWindow"
    );
    this._disposeObjects(
      "mainsplit",
      "left",
      "runbutton",
      "testSuiteUrl",
      "reloadbutton",
      "reloadswitch",
      "toolbar",
      "f1",
      "f2",
      "logappender",
      "iframe",
      "tree1",
      "loader"
    );
  },


  defer : function()
  {
    qx.core.Setting.define("qx.testPageUri",   "html/QooxdooTest.html");
    qx.core.Setting.define("qx.testNameSpace", "testrunner.test");
  }

});
