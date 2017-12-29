import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import Button from 'antd/lib/button';
import Checkbox from 'antd/lib/checkbox';
import Input from 'antd/lib/input';
import Tree from 'antd/lib/tree';
import uniq from 'lodash.uniq';
import difference from 'lodash.difference';
import './style.less';
const TreeNode = Tree.TreeNode;
const Search = Input.Search;

class TreeTransfer extends Component {
  constructor(props) {
    super(props);
    const { treeNode, listData, leafKeys } = this.generate(props);
    const treeCheckedKeys = listData.map(({key}) => key);
    this.state = {
      treeNode,
      listData,
      leafKeys,
      treeCheckedKeys,
      treeExpandedKeys: treeCheckedKeys,
      treeAutoExpandParent: true, // 自动展开父节点 初始为true 有展开操作的时候为false
      listCheckedKeys: [],
      treeSearchKey: '',
      listSearchKey: '',
    };
  }

  componentWillReceiveProps(nextProps) {
    const { treeNode, listData, leafKeys } = this.generate(nextProps);
    const treeCheckedKeys = listData.map(({key}) => key);
    this.setState({
      treeNode,
      listData,
      leafKeys,
      treeCheckedKeys,
    });
  }

  generate = (props) => {
    // 搜索的时候 自动展开父节点设为true
    const { source, target, rowKey, rowTitle, rowChildren, showSearch } = props;
    const { treeSearchKey } = this.state;
    const leafKeys = [];  // 叶子节点集合
    const listData = [];  // 列表数据

    const loop = data => data.map(item => {
      const { [rowChildren]: children, [rowKey]: key, [rowTitle]: title, ...otherProps } = item;
      if (children === undefined) {
        if (showSearch && treeSearchKey.length > 0) { // if tree searching
          if (title.indexOf(treeSearchKey) > -1) {
            leafKeys.push(key);
            const index = title.indexOf(treeSearchKey);
            const searchTitle = (
              <span>
                {title.substr(0, index)}
                <span style={{ color: '#f50' }}>{treeSearchKey}</span>
                {title.substr(index + treeSearchKey.length)}
              </span>
            );
            return <TreeNode key={key} title={searchTitle} isLeaf {...otherProps} />;
          }
        } else {
          leafKeys.push(key); 
        }
        if (target.indexOf(key) > -1) {
          listData.push({ key, title });
          return <TreeNode key={key} title={title} isLeaf {...otherProps} />;
        }
      } else {
        return (
          <TreeNode key={key} title={title} {...otherProps}>
            {loop(item.children)}
          </TreeNode>
        );
      }
    });

    return {
      treeNode: loop(source),
      leafKeys,
      listData
    };
  }

  // 点击树的checkbox
  treeOnCheck = (checkedKeys) => {
    this.setState({
      treeCheckedKeys: checkedKeys.filter(key => this.state.leafKeys.indexOf(key) > -1)
    });
  }

  // 点击列表的checkbox
  listOnCheck = (e, checkedKeys) => {
    if (e.target.checked) {
      this.setState({
        listCheckedKeys: uniq([...this.state.listCheckedKeys, ...checkedKeys])
      });
    } else {
      this.setState({
        listCheckedKeys: this.state.listCheckedKeys.filter(key => checkedKeys.indexOf(key) < 0)
      });
    }
  }

  // 左侧树搜索 onChange 
  onTreeSearch = (e) => {
    this.setState({
      listSearchKey: e.target.value
    });
  }

  // 右侧列表搜索 onChange 
  onListSearch = (e) => {
    this.setState({
      listSearchKey: e.target.value
    });
  }

  render() {
    const { className, sourceTitle, targetTitle, showSearch } = this.props;
    const { treeNode, listData, leafKeys, treeCheckedKeys, listCheckedKeys, treeExpandedKeys, treeAutoExpandParent, listSearchKey } = this.state;
    const listNode = listData.filter(item => showSearch ? item.title.indexOf(listSearchKey) > -1 : true);

    const treeTransferClass = classNames({
      'lucio-tree-transfer': true,
      [className]: !!className
    });

    const treeProps = {
      checkable: true,
      checkedKeys: treeCheckedKeys,
      onCheck: this.treeOnCheck,
      expandedKeys: treeExpandedKeys,
      autoExpandParent: treeAutoExpandParent,
      onExpand: (expandedKeys) => {
        console.log(expandedKeys);
        this.setState({
          treeAutoExpandParent: false,
          treeExpandedKeys: expandedKeys,
        });
      }
    };

    const listHeaderCheckProps = {
      checked: listCheckedKeys.length > 0 && listCheckedKeys.length === listData.length,
      indeterminate: listCheckedKeys.length > 0 && listCheckedKeys.length < listData.length,
      onChange: (e) => this.listOnCheck(e, listData.map(({key}) => key))
    };

    const operaRightButtonProps = {
      type: 'primary',
      icon: 'right',
      size: 'small',
      disabled: difference(treeCheckedKeys, listData.map(({key}) => key)).length === 0 && difference(listData.map(({key}) => key), treeCheckedKeys).length === 0,
      onClick: () => {
        this.props.onChange && this.props.onChange(this.state.treeCheckedKeys);
      }
    };

    const operaLeftButtonProps = {
      type: 'primary',
      icon: 'left',
      size: 'small',
      disabled: listCheckedKeys.length === 0,
      onClick: () => {
        this.setState({
          listCheckedKeys: []
        });
        this.props.onChange && this.props.onChange(this.state.listData.map(({key}) => key).filter(key => this.state.listCheckedKeys.indexOf(key) < 0));
      }
    };

    return (
      <div className={treeTransferClass}>
        <div className="tree-transfer-panel tree-transfer-panel-left">
          <div className="tree-transfer-panel-header">
            <span className="tree-transfer-panel-header-select">{`${treeCheckedKeys.length > 0 ? `${treeCheckedKeys.length}/` : ''}${leafKeys.length}`} 条数据</span>
            <span className="tree-transfer-panel-header-title">{sourceTitle}</span>
          </div>
          <div className="tree-transfer-panel-body">
            <div className="tree-transfer-panel-body-content">
              {showSearch ? <div className="tree-transfer-panel-body-content-search"><Search placeholder="请输入搜索关键字" /></div> : null}
              <Tree {...treeProps}>
                {treeNode}
              </Tree>
            </div>
          </div>
        </div>
        <div className="tree-transfer-operation">
          <Button {...operaRightButtonProps} />
          <Button {...operaLeftButtonProps} />
        </div>
        <div className="tree-transfer-panel tree-transfer-panel-right">
          <div className="tree-transfer-panel-header">
            <Checkbox {...listHeaderCheckProps} />
            <span className="tree-transfer-panel-header-select">{`${listCheckedKeys.length > 0 ? `${listCheckedKeys.length}/` : ''}${listNode.length}`} 条数据</span>
            <span className="tree-transfer-panel-header-title">{targetTitle}</span>
          </div>
          <div className="tree-transfer-panel-body">
            <ul className="tree-transfer-panel-body-content">
              {showSearch ? <div className="tree-transfer-panel-body-content-search"><Search placeholder="请输入搜索关键字" onChange={this.onListSearch} /></div> : null}
              {
                listNode.map(item => (
                  <li key={item.key}>
                    <Checkbox checked={listCheckedKeys.indexOf(item.key) > -1} onChange={(e) => this.listOnCheck(e, [item.key])} />
                    <span>{item.title}</span>
                  </li>
                ))
              }
            </ul>
          </div>
        </div>
      </div>
    );
  }
}

TreeTransfer.propTypes = {
  className: PropTypes.string,
  rowKey: PropTypes.string,
  rowTitle: PropTypes.string,
  rowChildren: PropTypes.string,
  source: PropTypes.array,
  target: PropTypes.array,
  sourceTitle: PropTypes.string,
  targetTitle: PropTypes.string,
  onChange: PropTypes.func,
  showSearch: PropTypes.bool
};

TreeTransfer.defaultProps = {
  rowKey: 'key',
  rowTitle: 'title',
  rowChildren: 'children',
  source: [],
  target: [],
  sourceTitle: '源数据',
  targetTitle: '目的数据',
  showSearch: false
};

export default TreeTransfer;