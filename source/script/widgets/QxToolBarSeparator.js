function QxToolBarSeparator()
{
  QxWidget.call(this);
  
  this.setWidth(8);
  this.setTop(0);
  this.setBottom(0);
  
  this._line = new QxWidget;
  
  with(this._line)
  {
    setCssClassName("QxToolBarSeparatorLine");
    
    setTop(2);
    setLeft(3);
    setWidth(2);
    setBottom(2);
  };
  
  this.add(this._line);  
};

QxToolBarSeparator.extend(QxWidget, "QxToolBarSeparator");
