import React from 'react';
import PropTypes from 'prop-types';
import { TweenOneGroup } from 'rc-tween-one';
import QueueAnim from 'rc-queue-anim';
import { Link } from 'react-router';
import { Affix } from 'antd';
import MobileMenu from 'rc-drawer-menu';
import classnames from 'classnames';
import nav from '../Layout/nav';
import { scrollClick, getModuleData, reSort } from '../utils';

const title = {};
nav.forEach((item) => {
  title[item.key] = item.name;
});

class Page extends React.PureComponent {
  static propTypes = {
    className: PropTypes.string,
    prefixCls: PropTypes.string,
    pathname: PropTypes.string,
    isMobile: PropTypes.bool,
    pageData: PropTypes.any,
    hash: PropTypes.any,
    children: PropTypes.any,
    moduleData: PropTypes.any,
  };

  static defaultProps = {
    className: 'page',
  };
  constructor(props) {
    super(props);
    this.state = {
      isHash: false,
    };
  }

  componentDidMount() {
    this.componentDidUpdate();
    this.enter = true;
  }

  componentDidUpdate() {
    this.hash = null;
    this.state.isHash = false;
    const props = this.props;
    const pathNames = props.pathname.split('/');
    const isComponent = pathNames[0] === 'components';
    if (isComponent) {
      if (window.addEventListener) {
        window.addEventListener('scroll', this.onScroll);
      } else {
        window.attachEvent('onscroll', this.onScroll);
      }
    } else {
      this.componentWillUnmount();
    }
  }

  componentWillUnmount() {
    this.hash = null;
    if (window.addEventListener) {
      window.removeEventListener('scroll', this.onScroll);
    } else {
      window.detachEvent('onscroll', this.onScroll);
    }
  }

  onScroll = () => {
    if (this.hash !== window.location.hash) {
      this.hash = window.location.hash;
      this.setState({
        isHash: true,
      });
    }
  }

  getMenuItems(moduleData, pathNames, isComponent) {
    if (!moduleData) {
      return null;
    }
    return reSort(moduleData).map((item, i) => {
      const meta = item.meta;
      let link = meta.filename.replace(/(\/index)|(.md)/g, '');
      const path = Array.isArray(pathNames) ? pathNames.join('/') : pathNames.replace('#', '');
      const hash = this.state.isHash && this.hash.replace('#', '');
      const className = hash === meta.id || path === link ||
        (!hash && ((!path && i === 0) || path === meta.id)) ? 'active' : '';
      // api 页面，链接把 components 转成 api
      link = this.props.pathname.match('api') ? link.replace('components', 'api') : link;
      const linkToChildren = isComponent ?
        (<a href={`#${meta.id}`} onClick={this.cScrollClick}>
          {meta.title}
        </a>) : (<Link to={link.split('/')[1] === pathNames[1] ? '' : link}>
          <span>{meta.chinese || meta.english}</span>
        </Link>);
      return (<li
        key={meta.english || meta.chinese || meta.id}
        className={className}
        disabled={meta.disabled}
      >
        {linkToChildren}
      </li>);
    });
  }

  getListChildren = (cPathNames, cModuleData, isComponent) => {
    const {
      isMobile, pageData, hash, pathname,
    } = this.props;
    const pathNames = cPathNames;
    // Ａpi页面, 地址转成 components;
    const isApi = pathNames[0] === 'api';
    pathNames[0] = pathNames[0] === 'api' ? 'components' : pathNames[0];
    const componentBool = isComponent && !isMobile;
    const moduleData = componentBool ?
      getModuleData(pageData[pathNames[0]][pathNames[1]]) :
      cModuleData;
    const listToRender = moduleData && this.getMenuItems(
      componentBool ? moduleData.demo : moduleData[pathNames[0]],
      componentBool ? hash : pathNames,
      componentBool
    );

    const listKey = pathNames[0] === 'components' && !pathname.match('api') ?
      pathname : pathNames[0];
    return (!isMobile ? (listToRender && (<Affix offsetTop={60} key="list" className="nav-list-wrapper">
      <QueueAnim
        type={['bottom', 'top']}
        duration={450}
        ease="easeInOutQuad"
        className="nav-list"
      >
        <h2 key={`${pathname.split('/')[0]}-title`}>
          {isComponent ? '范例' : title[pathNames[0]]}
        </h2>
        <ul key={listKey}>
          {listToRender}
        </ul>
      </QueueAnim>
    </Affix>)) :
      (<MobileMenu width="180px">
        <div className="nav-list-wrapper">
          <div className="nav-list">
            <h2 key={`${pathname.split('/')[0]}-title`}>
              {isApi ? 'API' : title[pathNames[0]]}
            </h2>
            <ul>
              {listToRender}
            </ul>
          </div>
        </div>
      </MobileMenu>
      ));
  }

  cScrollClick = (e) => {
    e.preventDefault();
    scrollClick(e);
  };

  render() {
    const {
      className, pathname, moduleData, pageData, children, prefixCls,
    } = this.props;
    const pathNames = pathname.split('/');
    const isComponent = pathNames[0] === 'components';
    const listToRender = this.getListChildren(pathNames, moduleData, isComponent);
    const pageDataNew = pathname.match('api') ?
      pageData.components[pathNames[1]].index : pageData;
    const childrenToRender = pathname.match('api') ?
      React.cloneElement(children, { pageData: pageDataNew }) : children;
    return (<div className={classnames(className, { [`${prefixCls}`]: !!prefixCls })}>
      <TweenOneGroup
        enter={{
          y: 30,
          type: 'from',
          opacity: 0,
          onComplete: (e) => {
            const { target } = { ...e };
            target.style.cssText = '';
          },
        }}
        leave={{ y: -30, opacity: 0 }}
        className={`${className}-wrapper`}
      >
        {listToRender}
        <section key="content">
          <TweenOneGroup
            enter={{ y: 30, type: 'from', opacity: 0 }}
            leave={{ y: -30, opacity: 0 }}
            className={`${className}-content`}
            style={{ minHeight: this.state.minHeight }}
          >
            <div key={pathname}>{childrenToRender}</div>
          </TweenOneGroup>
        </section>
      </TweenOneGroup>
    </div>);
  }
}

export default Page;
