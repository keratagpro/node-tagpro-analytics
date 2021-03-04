#!/usr/bin/php
<?php

// Copyright (c) 2015, Jeroen van der Gun
// All rights reserved.
//
// Redistribution and use in source and binary forms, with or without modification, are
// permitted provided that the following conditions are met:
//
// 1. Redistributions of source code must retain the above copyright notice, this list of
//    conditions and the following disclaimer.
//
// 2. Redistributions in binary form must reproduce the above copyright notice, this list of
//    conditions and the following disclaimer in the documentation and/or other materials
//    provided with the distribution.
//
// THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY
// EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF
// MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL
// THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
// SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT
// OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION)
// HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR
// TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
// SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

error_reporting(E_ALL);
ini_set('display_errors', '1');
if ($argc != 2)
    die('Usage: php ' . $argv[0] . " <filename>\n");

require './logreader.php';

class PlayerEventHandler extends PlayerLogReader
{
    protected function joinEvent($time, $newTeam)
    {
        global $player, $events;
        $events[$time][] = $player->name . ' joins team ' . $newTeam;
    }
    protected function quitEvent($time, $oldFlag, $oldPowers, $oldTeam)
    {
        global $player, $events;
        $events[$time][] = $player->name . ' quits team ' . $oldTeam;
    }
    protected function switchEvent($time, $oldFlag, $powers, $newTeam)
    {
        global $player, $events;
        $events[$time][] = $player->name . ' switches to team ' . $newTeam;
    }
    protected function grabEvent($time, $newFlag, $powers, $team)
    {
        global $player, $events;
        $events[$time][] = $player->name . ' grabs flag ' . $newFlag;
    }
    protected function captureEvent($time, $oldFlag, $powers, $team)
    {
        global $player, $events;
        $events[$time][] = $player->name . ' captures flag ' . $oldFlag;
    }
    protected function flaglessCaptureEvent($time, $flag, $powers, $team)
    {
        global $player, $events;
        $events[$time][] = $player->name . ' captures marsball';
    }
    protected function powerupEvent($time, $flag, $powerUp, $newPowers, $team)
    {
        global $player, $events;
        $events[$time][] = $player->name . ' powers up ' . $powerUp;
    }
    protected function duplicatePowerupEvent($time, $flag, $powers, $team)
    {
        global $player, $events;
        $events[$time][] = $player->name . ' extends power';
    }
    protected function powerdownEvent($time, $flag, $powerDown, $newPowers, $team)
    {
        global $player, $events;
        $events[$time][] = $player->name . ' powers down ' . $powerDown;
    }
    protected function returnEvent($time, $flag, $powers, $team)
    {
        global $player, $events;
        $events[$time][] = $player->name . ' returns';
    }
    protected function tagEvent($time, $flag, $powers, $team)
    {
        global $player, $events;
        $events[$time][] = $player->name . ' tags';
    }
    protected function dropEvent($time, $oldFlag, $powers, $team)
    {
        global $player, $events;
        $events[$time][]    = $player->name . ' drops flag ' . $oldFlag;
    }
    protected function popEvent($time, $powers, $team)
    {
        global $player, $events;
        $events[$time][]    = $player->name . ' pops';
    }
    protected function startPreventEvent($time, $flag, $powers, $team)
    {
        global $player, $events;
        $events[$time][] = $player->name . ' starts preventing';
    }
    protected function stopPreventEvent($time, $flag, $powers, $team)
    {
        global $player, $events;
        $events[$time][] = $player->name . ' stops preventing';
    }
    protected function startButtonEvent($time, $flag, $powers, $team)
    {
        global $player, $events;
        $events[$time][] = $player->name . ' starts buttoning';
    }
    protected function stopButtonEvent($time, $flag, $powers, $team)
    {
        global $player, $events;
        $events[$time][] = $player->name . ' stops buttoning';
    }
    protected function startBlockEvent($time, $flag, $powers, $team)
    {
        global $player, $events;
        $events[$time][] = $player->name . ' starts blocking';
    }
    protected function stopBlockEvent($time, $flag, $powers, $team)
    {
        global $player, $events;
        $events[$time][] = $player->name . ' stops blocking';
    }
    protected function endEvent($time, $flag, $powers, $team)
    {
        global $player, $events;
        if ($team)
            $events[$time][] = $player->name . ' ends in team ' . $team;
    }
    public function __construct()
    {
        global $match, $player, $events;
        if ($player->team)
            $events[0][] = $player->name . ' starts in team ' . $player->team;
        parent::__construct(base64_decode($player->events), $player->team, $match->duration);
    }
}

function timeFormat($time)
{
    return floor($time / 3600) . ':' . str_pad(floor($time % 3600 / 60), 2, '0', STR_PAD_LEFT) . '.' . str_pad(round($time % 60 / 0.6), 2, '0', STR_PAD_LEFT);
}

$match = json_decode(file_get_contents($argv[1]));

$events = array();

foreach ($match->players as $player)
    new PlayerEventHandler();

ksort($events);

foreach ($events as $time => $timeEvents)
    foreach ($timeEvents as $message)
        echo timeFormat($time), ' ', $message, "\n";

?>