<?php

// Copyright (c) 2020, Jeroen van der Gun
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

abstract class LogReader
{
 private $data;
 private $pos = 0;
 
 protected function __construct($data)
 {
  $this->data = $data;
 }
 
 protected function end()
 {
  return $this->pos >> 3 >= strlen($this->data);
 }
 
 protected function readBool()
 {
  $result = $this->end() ? 0 : ord($this->data[$this->pos >> 3]) >> 7 - ($this->pos & 7) & 1;
  ++$this->pos;
  return $result;
 }
 
 protected function readFixed($bits)
 {
  $result = 0;
  while($bits--)
   $result = $result << 1 | $this->readBool();
  return $result;
 }
 
 protected function readTally()
 {
  $result = 0;
  while($this->readBool())
   ++$result;
  return $result;
 }
 
 protected function readFooter()
 {
  $size = $this->readFixed(2) << 3;
  $free = 8 - ($this->pos & 7) & 7;
  $size |= $free;
  $minimum = 0;
  while($free < $size)
  {
   $minimum += 1 << $free;
   $free += 8;
  }
  return $this->readFixed($size) + $minimum;
 }
}

abstract class PlayerLogReader extends LogReader
{
 protected function joinEvent($time, $newTeam) {}
 protected function quitEvent($time, $oldFlag, $oldPowers, $oldTeam) {}
 protected function switchEvent($time, $oldFlag, $powers, $newTeam) {}
 protected function grabEvent($time, $newFlag, $powers, $team) {}
 protected function captureEvent($time, $oldFlag, $powers, $team) {}
 protected function flaglessCaptureEvent($time, $flag, $powers, $team) {}
 protected function powerupEvent($time, $flag, $powerUp, $newPowers, $team) {}
 protected function duplicatePowerupEvent($time, $flag, $powers, $team) {}
 protected function powerdownEvent($time, $flag, $powerDown, $newPowers, $team) {}
 protected function returnEvent($time, $flag, $powers, $team) {}
 protected function tagEvent($time, $flag, $powers, $team) {}
 protected function dropEvent($time, $oldFlag, $powers, $team) {}
 protected function popEvent($time, $powers, $team) {}
 protected function startPreventEvent($time, $flag, $powers, $team) {}
 protected function stopPreventEvent($time, $flag, $powers, $team) {}
 protected function startButtonEvent($time, $flag, $powers, $team) {}
 protected function stopButtonEvent($time, $flag, $powers, $team) {}
 protected function startBlockEvent($time, $flag, $powers, $team) {}
 protected function stopBlockEvent($time, $flag, $powers, $team) {}
 protected function endEvent($time, $flag, $powers, $team) {}
 
 const noTeam = 0;
 const redTeam = 1;
 const blueTeam = 2;
 
 const noFlag = 0;
 const opponentFlag = 1;
 const opponentPotatoFlag = 2;
 const neutralFlag = 3;
 const neutralPotatoFlag = 4;
 const temporaryFlag = 5;
 
 const noPower = 0;
 const jukeJuicePower = 1;
 const rollingBombPower = 2;
 const tagProPower = 4;
 const topSpeedPower = 8;
 
 public function __construct($data, $team, $duration)
 {
  parent::__construct($data);
  $time = 0;
  $flag = self::noFlag;
  $powers = self::noPower;
  $prevent = false;
  $button = false;
  $block = false;
  while(!$this->end())
  {
   $newTeam = $this->readBool() ? $team ? $this->readBool() ? self::noTeam : 3 - $team : 1 + $this->readBool() : $team; // quit : switch : join : stay
   $dropPop = $this->readBool();
   $returns = $this->readTally();
   $tags = $this->readTally();
   $grab = !$flag && $this->readBool();
   $captures = $this->readTally();
   $keep = !$dropPop && $newTeam && ($newTeam == $team || !$team) && (!$captures || (!$flag && !$grab) || $this->readBool());
   $newFlag = $grab ? $keep ? 1 + $this->readFixed(2) : self::temporaryFlag : $flag;
   $powerups = $this->readTally();
   $powersDown = self::noPower;
   $powersUp = self::noPower;
   for($i = 1; $i < 16; $i <<= 1)
    if($powers & $i) { if($this->readBool()) $powersDown |= $i; }
    else if($powerups && $this->readBool()) { $powersUp |= $i; $powerups--; }
   $togglePrevent = $this->readBool();
   $toggleButton = $this->readBool();
   $toggleBlock = $this->readBool();
   $time += 1 + $this->readFooter();
   if(!$team && $newTeam)
   {
    $team = $newTeam;
    $this->joinEvent($time, $team);
   }
   for($i = 0; $i < $returns; $i++) $this->returnEvent($time, $flag, $powers, $team);
   for($i = 0; $i < $tags; $i++) $this->tagEvent($time, $flag, $powers, $team);
   if($grab)
   {
    $flag = $newFlag;
    $this->grabEvent($time, $flag, $powers, $team);
   }
   if($captures--)
    do
    {
     if($keep || !$flag) $this->flaglessCaptureEvent($time, $flag, $powers, $team);
     else { $this->captureEvent($time, $flag, $powers, $team); $flag = self::noFlag; $keep = true; }
    }
    while($captures--);
   for($i = 1; $i < 16; $i <<= 1)
   {
    if($powersDown & $i) { $powers ^= $i; $this->powerdownEvent($time, $flag, $i, $powers, $team); }
    else if($powersUp & $i) { $powers |= $i; $this->powerupEvent($time, $flag, $i, $powers, $team); }
   }
   for($i = 0; $i < $powerups; $i++) $this->duplicatePowerupEvent($time, $flag, $powers, $team);
   if($togglePrevent)
   {
    if($prevent) { $this->stopPreventEvent($time, $flag, $powers, $team); $prevent = false; }
    else { $this->startPreventEvent($time, $flag, $powers, $team); $prevent = true; }
   }
   if($toggleButton)
   {
    if($button) { $this->stopButtonEvent($time, $flag, $powers, $team); $button = false; }
    else { $this->startButtonEvent($time, $flag, $powers, $team); $button = true; }
   }
   if($toggleBlock)
   {
    if($block) { $this->stopBlockEvent($time, $flag, $powers, $team); $block = false; }
    else { $this->startBlockEvent($time, $flag, $powers, $team); $block = true; }
   }
   if($dropPop)
   {
    if($flag) { $this->dropEvent($time, $flag, $powers, $team); $flag = self::noFlag; }
    else $this->popEvent($time, $powers, $team);
   }
   if($newTeam != $team)
   {
    if(!$newTeam) { $this->quitEvent($time, $flag, $powers, $team); $powers = self::noPower; }
    else $this->switchEvent($time, $flag, $powers, $newTeam);
    $flag = self::noFlag;
    $team = $newTeam;
   }
  }
  $this->endEvent($duration, $flag, $powers, $team);
 }
}

abstract class MapLogReader extends LogReader
{
 protected function heightEvent($newY) {}
 protected function tileEvent($newX, $y, $tile) {}
 
 const emptyTile = 0;
 const squareWallTile = 10;
 const lowerLeftDiagonalWallTile = 11;
 const upperLeftDiagonalWallTile = 12;
 const upperRightDiagonalWallTile = 13;
 const lowerRightDiagonalWallTile = 14;
 const neutralFloorTile = 20;
 const redFlagTile = 30;
 const blueFlagTile = 40;
 const neutralSpeedpadTile = 50;
 const powerupTile = 60;
 const jukeJuicePowerupTile = 61;
 const rollingBombPowerupTile = 62;
 const tagProPowerupTile = 63;
 const topSpeedPowerupTile = 64;
 const spikeTile = 70;
 const buttonTile = 80;
 const openGateTile = 90;
 const closedGateTile = 91;
 const redGateTile = 92;
 const blueGateTile = 93;
 const bombTile = 100;
 const redFloorTile = 110;
 const blueFloorTile = 120;
 const entryPortalTile = 130;
 const exitPortalTile = 131;
 const redSpeedpadTile = 140;
 const blueSpeedpadTile = 150;
 const neutralFlagTile = 160;
 const temporaryFlagTile = 161; // just a dummy, cannot occur on maps
 const redEndzoneTile = 170;
 const blueEndzoneTile = 180;
 const redPotatoFlagTile = 190;
 const bluePotatoFlagTile = 200;
 const neutralPotatoFlagTile = 210;
 const marsballTile = 211; // just a dummy, cannot occur on maps
 const gravitywellTile = 220;
 const yellowFloorTile = 230;
 const redEntryPortalTile = 240;
 const redExitPortalTile = 241;
 const blueEntryPortalTile = 250;
 const blueExitPortalTile = 251;
 
 public function __construct($data, $width)
 {
  parent::__construct($data);
  $x = 0; $y = 0;
  while(!$this->end() || $x)
  {
   if($tile = $this->readFixed(6))
   {
         if($tile <  6) $tile +=   9;              //  1- 5 ->  10- 14
    else if($tile < 13) $tile = ($tile -  4) * 10; //  6-12 ->  20- 80
    else if($tile < 17) $tile +=  77;              // 13-16 ->  90- 93
    else if($tile < 20) $tile = ($tile -  7) * 10; // 17-19 -> 100-120
    else if($tile < 22) $tile += 110;              // 20-21 -> 130-131
    else if($tile < 32) $tile = ($tile -  8) * 10; // 22-31 -> 140-230
    else if($tile < 34) $tile += 208;              // 32-33 -> 240-241
    else if($tile < 36) $tile += 208;              // 34-35 -> 250-251
    else                $tile = ($tile - 10) * 10; // 36-63 -> 260-530
   }
   for($i = 1 + $this->readFooter(); $i; $i--)
   {
    if(!$x) $this->heightEvent($y);
    $this->tileEvent($x, $y, $tile);
    if(++$x == $width) { $x = 0; ++$y; }
   }
  }
 }
}

abstract class SplatLogReader extends LogReader
{
 protected function splatsEvent($splats, $timeIndex) {}
 
 private static function bits($size)
 {
  $size *= 40;
  $grid = $size - 1;
  $result = 32;
  if(!($grid & 0xFFFF0000)) { $result -= 16; $grid <<= 16; }
  if(!($grid & 0xFF000000)) { $result -=  8; $grid <<=  8; }
  if(!($grid & 0xF0000000)) { $result -=  4; $grid <<=  4; }
  if(!($grid & 0xC0000000)) { $result -=  2; $grid <<=  2; }
  if(!($grid & 0x80000000)) $result--;
  return array($result, ((1 << $result) - $size >> 1) + 20);
 }
 
 public function __construct($data, $width, $height)
 {
  parent::__construct($data);
  $x = $this->bits($width);
  $y = $this->bits($height);
  for($time = 0; !$this->end(); $time++)
   if($i = $this->readTally())
   {
    $splats = array();
    while($i--)
     $splats[] = array($this->readFixed($x[0]) - $x[1], $this->readFixed($y[0]) - $y[1]);
    $this->splatsEvent($splats, $time);
   }
 }
}

?>