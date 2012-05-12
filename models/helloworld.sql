-- phpMyAdmin SQL Dump
-- version 3.3.9.2
-- http://www.phpmyadmin.net
--
-- Host: localhost
-- Generation Time: Oct 07, 2011 at 03:03 PM
-- Server version: 5.0.92
-- PHP Version: 5.2.9

SET SQL_MODE="NO_AUTO_VALUE_ON_ZERO";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;

--
-- Database: `nightlig_helloworld`
--

-- --------------------------------------------------------

--
-- Table structure for table `content`
--

CREATE TABLE IF NOT EXISTS `content` (
  `id` bigint(20) unsigned NOT NULL auto_increment,
  `username` varchar(255) NOT NULL,
  `section` varchar(255) NOT NULL,
  `album` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `template` varchar(255) NOT NULL,
  `sort_type` varchar(255) NOT NULL,
  `redirect` bigint(20) unsigned NOT NULL default '0',
  `hidden` tinyint(1) NOT NULL default '0',
  `forum` tinyint(1) NOT NULL default '0',
  `title` text NOT NULL,
  `date_created` datetime NOT NULL,
  `date_updated` datetime NOT NULL,
  `date_start` datetime default NULL,
  `date_end` datetime default NULL,
  `date_repeats` int(11) NOT NULL,
  `thumb` text NOT NULL,
  `order` bigint(20) unsigned NOT NULL,
  `count` int(11) NOT NULL default '0',
  `count_robot` int(11) NOT NULL default '0',
  `favorites` int(11) NOT NULL,
  `shares` int(11) NOT NULL,
  `comments_count` int(11) NOT NULL,
  `comments_updated` datetime default NULL,
  `price` float NOT NULL,
  `favorited` tinyint(1) NOT NULL,
  `is_spam` tinyint(1) NOT NULL,
  `deleted` tinyint(1) NOT NULL,
  `thread` text NOT NULL,
  `thread_user` text NOT NULL,
  `avatar` text NOT NULL,
  `style` mediumtext NOT NULL,
  `code` mediumtext NOT NULL,
  `view` mediumtext NOT NULL,
  PRIMARY KEY  (`id`),
  UNIQUE KEY `uri` (`username`,`name`),
  KEY `section` (`section`),
  KEY `name` (`name`),
  KEY `user` (`username`),
  KEY `album` (`album`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Table structure for table `content_remote`
--

CREATE TABLE IF NOT EXISTS `content_remote` (
  `id` bigint(20) unsigned NOT NULL auto_increment,
  `to_username` varchar(255) NOT NULL,
  `local_content_name` varchar(255) NOT NULL,
  `from_user` text NOT NULL,
  `username` varchar(255) NOT NULL,
  `creator` varchar(255) NOT NULL,
  `avatar` text NOT NULL,
  `title` text NOT NULL,
  `post_id` text NOT NULL,
  `link` text NOT NULL,
  `date_created` datetime NOT NULL,
  `date_updated` datetime default NULL,
  `comments_updated` datetime default NULL,
  `comments_count` int(11) NOT NULL default '0',
  `thread` text NOT NULL,
  `type` varchar(255) NOT NULL,
  `favorited` tinyint(1) NOT NULL,
  `read` tinyint(1) NOT NULL,
  `is_spam` tinyint(1) NOT NULL,
  `deleted` tinyint(1) NOT NULL,
  `view` mediumtext NOT NULL,
  PRIMARY KEY  (`id`),
  KEY `to_username` (`to_username`),
  KEY `from_user` (`from_user`(255)),
  KEY `to_username_2` (`to_username`,`from_user`(255))
  KEY `thread` (`thread`(255))
) ENGINE=InnoDB  DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE IF NOT EXISTS `users` (
  `id` int(11) NOT NULL auto_increment,
  `username` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `author` tinyint(1) NOT NULL default '0',
  `superuser` tinyint(1) NOT NULL default '0',
  `title` varchar(255) NOT NULL,
  `description` varchar(255) NOT NULL,
  `hostname` varchar(255) NOT NULL,
  `adult_content` tinyint(1) NOT NULL default '0',
  `license` text NOT NULL,
  `tipjar` text NOT NULL,
  `sidebar_ad` text NOT NULL,
  `newsletter_endpoint` text NOT NULL,
  `google_analytics` varchar(255) NOT NULL,
  `favicon` text NOT NULL,
  `logo` text NOT NULL,
  `theme` varchar(255) NOT NULL,
  `currency` varchar(3) NOT NULL,
  `magic_key` text NOT NULL,
  `private_key` text NOT NULL,
  `extra_head_html` text NOT NULL,
  `extra_body_end_html` text NOT NULL,
  `theme_title` varchar(255) NOT NULL,
  `theme_link` text NOT NULL,
  `theme_author` varchar(255) NOT NULL,
  `theme_author_link` text NOT NULL,
  `twitter` text NOT NULL,
  `facebook` text NOT NULL,
  `google` text NOT NULL,
  PRIMARY KEY  (`id`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `oauth` (`oauth`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Table structure for table `users_remote`
--

CREATE TABLE IF NOT EXISTS `users_remote` (
  `id` int(11) NOT NULL auto_increment,
  `local_username` varchar(255) NOT NULL,
  `username` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `magic_key` text NOT NULL,
  `profile_url` text NOT NULL,
  `salmon_url` text NOT NULL,
  `feed_url` text NOT NULL,
  `hub_url` text NOT NULL,
  `follower` tinyint(1) NOT NULL,
  `following` tinyint(1) NOT NULL,
  `avatar` text NOT NULL,
  `favicon` text NOT NULL,
  `order` int(11) NOT NULL,
  `sort_type` varchar(255) NOT NULL,
  PRIMARY KEY  (`id`),
  KEY `local_username` (`local_username`),
  KEY `profile_url` (`profile_url`(255)),
  KEY `local_username_2` (`local_username`,`profile_url`(255))
) ENGINE=InnoDB  DEFAULT CHARSET=utf8;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `content`
--
ALTER TABLE `content`
  ADD CONSTRAINT `content_ibfk_1` FOREIGN KEY (`username`) REFERENCES `users` (`username`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `content_remote`
--
ALTER TABLE `content_remote`
  ADD CONSTRAINT `content_remote_ibfk_1` FOREIGN KEY (`to_username`) REFERENCES `users` (`username`) ON DELETE CASCADE ON UPDATE CASCADE;
